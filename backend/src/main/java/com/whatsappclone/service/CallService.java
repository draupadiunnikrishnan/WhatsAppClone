package com.whatsappclone.service;

import com.whatsappclone.domain.CallSession;
import com.whatsappclone.repository.CallSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CallService {

    private final CallSessionRepository callSessionRepository;

    public CallSession createCall(String callerId, String receiverId, CallSession.CallType type) {
        CallSession session = new CallSession();
        session.setCallerId(callerId);
        session.setReceiverId(receiverId);
        session.setType(type);
        session.setState(CallSession.CallState.INITIATED);
        session.setStartTime(LocalDateTime.now());
        return callSessionRepository.save(session);
    }

    public void updateCallState(Long callId, CallSession.CallState state) {
        callSessionRepository.findById(callId).ifPresent(session -> {
            session.setState(state);
            if (state == CallSession.CallState.ENDED || state == CallSession.CallState.REJECTED) {
                session.setEndTime(LocalDateTime.now());
            }
            callSessionRepository.save(session);
        });
    }

    public void answerCall(String receiverId, String callerId) {
        // Assuming the receiver is answering the call from caller
        callSessionRepository.findTopByCallerIdAndReceiverIdOrderByStartTimeDesc(callerId, receiverId)
                .ifPresent(session -> {
                    if (session.getState() == CallSession.CallState.INITIATED
                            || session.getState() == CallSession.CallState.RINGING) {
                        session.setState(CallSession.CallState.CONNECTED);
                        callSessionRepository.save(session);
                    }
                });
    }

    public void endCall(String senderId, String recipientId) {
        // Try both directions as either could end it
        callSessionRepository.findTopByCallerIdAndReceiverIdOrderByStartTimeDesc(senderId, recipientId)
                .ifPresentOrElse(
                        session -> endCallSession(session),
                        () -> callSessionRepository
                                .findTopByCallerIdAndReceiverIdOrderByStartTimeDesc(recipientId, senderId)
                                .ifPresent(this::endCallSession));
    }

    private void endCallSession(CallSession session) {
        session.setState(CallSession.CallState.ENDED);
        session.setEndTime(LocalDateTime.now());
        callSessionRepository.save(session);
    }

    public void endCall(Long callId) {
        callSessionRepository.findById(callId).ifPresent(this::endCallSession);
    }
}
