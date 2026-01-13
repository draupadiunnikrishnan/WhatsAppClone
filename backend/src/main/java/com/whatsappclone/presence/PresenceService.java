package com.whatsappclone.presence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PresenceService {

    // Map<UserId (Email), WebSocketSession>
    private final Map<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();

    public void addUserSession(String userId, WebSocketSession session) {
        activeSessions.put(userId, session);
    }

    public void removeUserSession(String userId) {
        activeSessions.remove(userId);
    }

    public void removeSession(WebSocketSession session) {
        activeSessions.values().remove(session);
    }

    public WebSocketSession getSession(String userId) {
        return activeSessions.get(userId);
    }

    public boolean isUserOnline(String userId) {
        return activeSessions.containsKey(userId) && activeSessions.get(userId).isOpen();
    }
}
