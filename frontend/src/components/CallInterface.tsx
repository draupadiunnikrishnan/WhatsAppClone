import React, { useEffect, useRef } from 'react';
import { useCallStore } from '../store/useCallStore';
import { Mic, Video, PhoneOff } from 'lucide-react';
// useAuthStore was imported but not used

export const CallInterface: React.FC = () => {
    const { localStream, remoteStream, endCall, callState, receiverId } = useCallStore();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);


    // const isVideoCall = true; // Assume true for now or get from callType

    if (callState === 'IDLE' && !localStream) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
            {/* Remote Video - Full Screen or Large */}
            <div className="relative w-full h-full flex items-center justify-center bg-black">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="max-h-full max-w-full object-contain"
                    />
                ) : (
                    <div className="text-white text-2xl animate-pulse">
                        {callState === 'OUTGOING' ? `Calling ${receiverId}...` : 'Connecting...'}
                    </div>
                )}
            </div>

            {/* Local Video - PiP */}
            {localStream && (
                <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-8 flex gap-4">
                <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                    <Mic size={24} />
                </button>
                <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                    <Video size={24} />
                </button>
                <button
                    onClick={endCall}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                    <PhoneOff size={24} />
                </button>
            </div>

            {/* Incoming Call Overlay (if strictly using this component for everything, but better separate) */}
        </div>
    );
};
