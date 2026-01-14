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
        activeSessions.entrySet().removeIf(entry -> entry.getValue().equals(session));
    }

    public WebSocketSession getSession(String userId) {
        return activeSessions.get(userId);
    }

    public boolean isUserOnline(String userId) {
        return activeSessions.containsKey(userId) && activeSessions.get(userId).isOpen();
    }

    public Map<String, String> getActiveUsers() {
        Map<String, String> users = new java.util.HashMap<>();
        activeSessions.forEach((id, session) -> {
            if (session.isOpen()) {
                users.put(id, session.getId());
            }
        });
        return users;
    }
}
