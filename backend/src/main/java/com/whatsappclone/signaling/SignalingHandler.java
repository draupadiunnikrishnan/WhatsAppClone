package com.whatsappclone.signaling;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsappclone.domain.CallSession;
import com.whatsappclone.presence.PresenceService;
import com.whatsappclone.security.JwtUtil;
import com.whatsappclone.service.CallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class SignalingHandler extends TextWebSocketHandler {

    private final PresenceService presenceService;
    private final CallService callService;
    private final ObjectMapper objectMapper;
    private final JwtUtil jwtUtil;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // Extract token from query param ?token=...
        URI uri = session.getUri();
        log.info("WebSocket Handshake started. URI: {}", uri);
        String query = (uri != null) ? uri.getQuery() : null;
        String token = null;

        if (query != null && query.contains("token=")) {
            try {
                // More robust extraction in case of multiple params or encoding
                for (String param : query.split("&")) {
                    if (param.startsWith("token=")) {
                        token = param.substring(6);
                        break;
                    }
                }
                log.info("Extracted token: {}...",
                        (token != null && token.length() > 10) ? token.substring(0, 10) : "null");
            } catch (Exception e) {
                log.error("Error parsing query params: {}", e.getMessage());
            }
        } else {
            log.warn("Handshake query is missing 'token' parameter. Query: {}", query);
        }

        if (token != null) {
            try {
                String username = jwtUtil.extractUsername(token);
                if (username != null) {
                    username = username.toLowerCase(); // Normalization
                }
                if (jwtUtil.validateToken(token, username)) {
                    session.getAttributes().put("userId", username);
                    presenceService.addUserSession(username, session);
                    log.info("User connected and session registered: {}", username);
                    return;
                } else {
                    log.warn("Connection REJECTED for user: {} (Token invalid or expired)", username);
                }
            } catch (Exception e) {
                log.error("Invalid token attempt: {}", e.getMessage());
            }
        } else {
            log.warn("Connection REJECTED: No token provided in query params");
        }
        session.close(CloseStatus.POLICY_VIOLATION);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        SignalingMessage signalingMessage = objectMapper.readValue(payload, SignalingMessage.class);

        String recipientId = signalingMessage.getRecipientId();
        String senderId = signalingMessage.getSenderId();

        if (recipientId != null)
            recipientId = recipientId.toLowerCase();
        if (senderId != null)
            senderId = senderId.toLowerCase();

        // Persist State based on type - Wrap in try-catch to avoid blocking signal
        // forwarding
        try {
            if ("offer".equals(signalingMessage.getType())) {
                log.info("Creating call session: {} -> {}", senderId, recipientId);
                callService.createCall(senderId, recipientId, CallSession.CallType.VIDEO);
            } else if ("answer".equals(signalingMessage.getType())) {
                log.info("Answering call session: {} -> {}", senderId, recipientId);
                callService.answerCall(senderId, recipientId);
            } else if ("end".equals(signalingMessage.getType())) {
                log.info("Ending call session: {} -> {}", senderId, recipientId);
                callService.endCall(senderId, recipientId);
            }
        } catch (Exception e) {
            log.error("Error updating call state in database: {}", e.getMessage());
            // Continue signaling even if DB update fails
        }

        WebSocketSession recipientSession = presenceService.getSession(recipientId);
        if (recipientSession != null && recipientSession.isOpen()) {
            recipientSession.sendMessage(message);
            log.info("FORWARDED: {} -> {} (Type: {})", senderId, recipientId, signalingMessage.getType());
        } else {
            log.warn("FAILED TO FORWARD: {} -> {} (Type: {}). Recipient offline or session not found.",
                    senderId, recipientId, signalingMessage.getType());
            log.info("Currently online users: {}", presenceService.getActiveUsers().keySet());

            // Notify sender that recipient is offline
            SignalingMessage errorMessage = new SignalingMessage();
            errorMessage.setType("end");
            errorMessage.setSenderId("SYSTEM");
            errorMessage.setRecipientId(senderId);
            errorMessage.setPayload(Map.of("reason", "User " + recipientId + " is offline"));
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorMessage)));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = (String) session.getAttributes().get("userId");
        if (userId != null) {
            presenceService.removeUserSession(userId);
            log.info("User session REMOVED: {} (Session ID: {})", userId, session.getId());
        } else {
            presenceService.removeSession(session);
            log.info("Anonymous session closed: {}", session.getId());
        }
    }
}
