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
    signalingConnected: boolean;
    isVideoCall: boolean;

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

socket.on('connectionChange', (connected: boolean) => {
    useCallStore.setState({ signalingConnected: connected });
});

export const useCallStore = create<CallStore>((set, get) => ({
    callState: 'IDLE',
    callerId: null,
    receiverId: null,
    localStream: null,
    remoteStream: null,
    pendingOffer: null,
    signalingConnected: socket.isConnected(),
    isVideoCall: true,

    setLocalStream: (stream) => set({ localStream: stream }),

    initiateCall: async (receiverId, video = true) => {
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            alert('WebRTC requires a secure context (HTTPS or localhost). Calls will not work over plain HTTP on an IP address.');
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Media devices are not supported or blocked in this browser/context.');
            return;
        }

        if (!get().signalingConnected) {
            alert('Not connected to signaling server. Please wait or refresh.');
            return;
        }
        set({ callState: 'OUTGOING', receiverId });
        try {
            const stream = await webrtc.getLocalStream(video, true);
            set({ localStream: stream });

            // CRITICAL: Set callback BEFORE creating peer connection
            webrtc.onRemoteStream = (stream) => {
                console.log("Remote stream received in caller store");
                set({ remoteStream: stream });
            };

            webrtc.createPeerConnection();
            webrtc.onIceCandidate = (candidate) => {
                const currentUserEmail = useAuthStore.getState().user?.email;
                if (currentUserEmail) {
                    socket.send('candidate', candidate, receiverId, currentUserEmail);
                }
            };

            const offer = await webrtc.createOffer();
            const currentUserEmail = useAuthStore.getState().user?.email;
            if (currentUserEmail) {
                // Include video flag in the signaling payload
                socket.send('offer', { ...offer, video }, receiverId, currentUserEmail);
            }
            set({ isVideoCall: video });
        } catch (err) {
            console.error("Error initiating call:", err);
            set({ callState: 'IDLE' });
        }
    },

    acceptCall: async () => {
        const { callerId, pendingOffer, isVideoCall } = get();
        if (!callerId || !pendingOffer) return;

        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            alert('WebRTC requires a secure context to accept calls.');
            return;
        }

        set({ callState: 'CONNECTED' });
        const stream = await webrtc.getLocalStream(isVideoCall, true);
        set({ localStream: stream });

        // CRITICAL: Assign callback BEFORE creating peer connection to avoid missing tracks
        webrtc.onRemoteStream = (stream) => {
            console.log("Remote stream received in store");
            set({ remoteStream: stream });
        };

        webrtc.createPeerConnection();

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

    incomingCall: (_data) => {
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
            // Signal contains SDP in 'payload' and possibly 'video' flag
            const isVideo = payload.video !== undefined ? payload.video : true;
            set({
                callState: 'INCOMING',
                callerId: senderId,
                pendingOffer: payload,
                isVideoCall: isVideo
            });
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
