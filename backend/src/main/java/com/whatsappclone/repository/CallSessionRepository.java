package com.whatsappclone.repository;

import com.whatsappclone.domain.CallSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CallSessionRepository extends JpaRepository<CallSession, Long> {
    Optional<CallSession> findTopByCallerIdAndReceiverIdOrderByStartTimeDesc(String callerId, String receiverId);
}
