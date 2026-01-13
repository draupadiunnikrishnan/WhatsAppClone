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
        String query = uri.getQuery();
        String token = null;
        if (query != null && query.contains("token=")) {
            token = query.split("token=")[1].split("&")[0];
        }

        if (token != null) {
            try {
                String username = jwtUtil.extractUsername(token);
                if (jwtUtil.validateToken(token, username)) {
                    presenceService.addUserSession(username, session);
                    log.info("User connected: {}", username);
                    return;
                }
            } catch (Exception e) {
                log.error("Invalid token", e);
            }
        }
        session.close(CloseStatus.POLICY_VIOLATION);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        SignalingMessage signalingMessage = objectMapper.readValue(payload, SignalingMessage.class);

        String recipientId = signalingMessage.getRecipientId();
        String senderId = signalingMessage.getSenderId();

        // Persist State based on type
        if ("offer".equals(signalingMessage.getType())) {
            // Assume payload contains type info or default to VIDEO for now
            callService.createCall(senderId, recipientId, CallSession.CallType.VIDEO);
        } else if ("answer".equals(signalingMessage.getType())) {
            // Find active call and update to CONNECTED (Simplified)
            callService.answerCall(senderId, recipientId);
        } else if ("end".equals(signalingMessage.getType())) {
            // Find active call and update to ENDED
            callService.endCall(senderId, recipientId);
        }

        WebSocketSession recipientSession = presenceService.getSession(recipientId);
        if (recipientSession != null && recipientSession.isOpen()) {
            recipientSession.sendMessage(message);
            log.info("Forwarded message type {} from {} to {}", signalingMessage.getType(), senderId, recipientId);
        } else {
            log.warn("Recipient NOT found or offline: {}", recipientId);
            // Notify sender that recipient is offline
            SignalingMessage errorMessage = new SignalingMessage();
            errorMessage.setType("end");
            errorMessage.setSenderId("SYSTEM");
            errorMessage.setRecipientId(senderId);
            errorMessage.setPayload(Map.of("reason", "User is offline"));
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorMessage)));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        presenceService.removeSession(session);
        log.info("Session closed: {}", session.getId());
    }
}
