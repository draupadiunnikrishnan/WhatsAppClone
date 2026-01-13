package com.whatsappclone.signaling;

import lombok.Data;

@Data
public class SignalingMessage {
    private String type; // "offer", "answer", "candidate", "login"
    private Object payload;
    private String recipientId; // email or userId
    private String senderId;
}
