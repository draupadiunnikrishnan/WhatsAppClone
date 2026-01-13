import { create } from 'zustand';
import { SocketService } from '../services/socket';
import { WebRTCService } from '../services/webrtc';
import { useAuthStore } from './useAuthStore';

type CallState = 'IDLE' | 'INCOMING' | 'OUTGOING' | 'CONNECTED' | 'ENDED';

interface CallStore {
    callState: CallState;
    callerId: string | null;
    receiverId: string | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    pendingOffer: any | null;

    initiateCall: (receiverId: string, video?: boolean) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;

    // Internal handlers called by Setup
    incomingCall: (data: any) => void;
    handleSignal: (data: any) => void;
    setLocalStream: (stream: MediaStream) => void;
}

const webrtc = new WebRTCService();
const socket = SocketService.getInstance();

export const useCallStore = create<CallStore>((set, get) => ({
    callState: 'IDLE',
    callerId: null,
    receiverId: null,
    localStream: null,
    remoteStream: null,
    pendingOffer: null, // Initialize pendingOffer

    setLocalStream: (stream) => set({ localStream: stream }),

    initiateCall: async (receiverId, video = true) => {
        if (!socket.isConnected()) {
            alert('Not connected to signaling server. Please wait or refresh.');
            return;
        }
        set({ callState: 'OUTGOING', receiverId });
        try {
            const stream = await webrtc.getLocalStream(video, true);
            set({ localStream: stream });

            webrtc.createPeerConnection();
            webrtc.onRemoteStream = (stream) => set({ remoteStream: stream });
            webrtc.onIceCandidate = (candidate) => {
                const currentUserEmail = useAuthStore.getState().user?.email;
                if (currentUserEmail) {
                    socket.send('candidate', candidate, receiverId, currentUserEmail);
                }
            };

            const offer = await webrtc.createOffer();
            const currentUserEmail = useAuthStore.getState().user?.email;
            if (currentUserEmail) {
                socket.send('offer', offer, receiverId, currentUserEmail);
            }
        } catch (err) {
            console.error("Error initiating call:", err);
            set({ callState: 'IDLE' });
        }
    },

    acceptCall: async () => {
        const { callerId, pendingOffer } = get();
        if (!callerId || !pendingOffer) return;

        set({ callState: 'CONNECTED' });
        const stream = await webrtc.getLocalStream(true, true);
        set({ localStream: stream });

        webrtc.createPeerConnection();
        webrtc.onRemoteStream = (stream) => set({ remoteStream: stream });
        webrtc.onIceCandidate = (candidate) => {
            const currentUserEmail = useAuthStore.getState().user?.email;
            if (currentUserEmail) {
                socket.send('candidate', candidate, callerId, currentUserEmail);
            }
        };

        // The webrtc.handleOffer(pendingOffer) call is implicitly handled within createAnswer(pendingOffer)
        const answer = await webrtc.createAnswer(pendingOffer);
        const currentUserEmail = useAuthStore.getState().user?.email;
        if (currentUserEmail) {
            socket.send('answer', answer, callerId, currentUserEmail);
        }
        set({ pendingOffer: null });
    },

    rejectCall: () => {
        const { callerId } = get();
        if (callerId) {
            const currentUserEmail = useAuthStore.getState().user?.email;
            if (currentUserEmail) {
                socket.send('end', {}, callerId, currentUserEmail);
            }
        }
        set({ callState: 'IDLE', callerId: null, receiverId: null, pendingOffer: null });
    },

    endCall: () => {
        const { receiverId, callerId } = get();
        const target = receiverId || callerId;
        if (target) {
            const currentUserEmail = useAuthStore.getState().user?.email;
            if (currentUserEmail) {
                socket.send('end', {}, target, currentUserEmail);
            }
        }
        webrtc.close();
        set({ callState: 'IDLE', localStream: null, remoteStream: null, callerId: null, receiverId: null, pendingOffer: null });
    },

    incomingCall: (data) => {
        if (get().callState !== 'IDLE') {
            // Busy
            // socket.send('busy', ...)
            return;
        }
        // The actual state change and offer storage is now handled in handleSignal for 'offer' type
    },

    handleSignal: async (data: any) => {
        const { type, payload, senderId } = data;
        if (type === 'offer') {
            set({ callState: 'INCOMING', callerId: senderId, pendingOffer: payload });
        }
        if (type === 'candidate') {
            webrtc.handleCandidate(payload);
        }
        if (type === 'answer') {
            webrtc.handleAnswer(payload);
            set({ callState: 'CONNECTED' });
        }
        if (type === 'end') {
            get().endCall();
        }
    }
}));
