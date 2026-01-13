package com.whatsappclone.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_sessions")
@Data
@NoArgsConstructor
public class CallSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String callerId; // Metadata (e.g. email)

    @Column(nullable = false)
    private String receiverId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CallType type;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CallState state;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    public enum CallType {
        VOICE, VIDEO
    }

    public enum CallState {
        INITIATED, RINGING, CONNECTED, ENDED, REJECTED, FAILED
    }
}
