import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useCallStore } from '../store/useCallStore';
import { CallInterface } from '../components/CallInterface';
import { Phone, Video, LogOut, ShieldAlert } from 'lucide-react';
export const Dashboard: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { callState, initiateCall, acceptCall, rejectCall, callerId, signalingConnected, isVideoCall } = useCallStore();
    const [targetEmail, setTargetEmail] = useState('');

    const handleCall = (video: boolean) => {
        const email = targetEmail.trim().toLowerCase();
        if (!email) return;
        console.log(`Starting ${video ? 'video' : 'voice'} call to:`, email);
        initiateCall(email, video);
    };


    return (
        <div className="min-h-screen bg-darker p-4 text-white">
            <header className="flex justify-between items-center mb-8 p-4 bg-dark rounded-lg">
                <h1 className="text-xl font-bold">WhatsApp Clone</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 mr-2">
                        <div className={`w-3 h-3 rounded-full ${signalingConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'}`}></div>
                        <span className="text-xs text-gray-400">{signalingConnected ? 'Online' : 'Offline'}</span>
                    </div>
                    <span>{user?.email}</span>
                    <button onClick={logout} className="p-2 bg-red-600 rounded-full hover:bg-red-700 ml-2">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {(!window.isSecureContext && window.location.hostname !== 'localhost') && (
                <div className="max-w-md mx-auto mb-6 p-4 bg-amber-900/40 border border-amber-600/50 rounded-lg flex items-start gap-3">
                    <ShieldAlert className="text-amber-500 shrink-0" size={20} />
                    <div>
                        <h3 className="text-amber-500 font-bold text-sm">Insecure Context Detected</h3>
                        <p className="text-xs text-gray-300 mt-1">
                            Browser security blocks WebRTC (Camera/Mic) on non-HTTPS connections.
                            To test between machines, use <b>localhost</b> or set up <b>HTTPS</b>.
                        </p>
                    </div>
                </div>
            )}

            <div className="max-w-md mx-auto bg-dark p-6 rounded-lg">
                <h2 className="text-lg mb-4">Start a Call</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter email to call"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="flex-1 p-2 rounded bg-gray-700 outline-none"
                    />
                    <button
                        onClick={() => handleCall(false)}
                        className="p-2 bg-gray-600 rounded hover:bg-gray-500"
                    >
                        <Phone size={20} />
                    </button>
                    <button
                        onClick={() => handleCall(true)}
                        className="p-2 bg-secondary text-darker rounded hover:opacity-90"
                    >
                        <Video size={20} />
                    </button>
                </div>
            </div>

            {/* Income Call Modal */}
            {callState === 'INCOMING' && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-dark p-8 rounded-lg flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-2xl uppercase">{callerId?.[0]}</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold">{callerId}</h3>
                            <p className="text-gray-400">Incoming {isVideoCall ? 'Video' : 'Voice'} Call...</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={rejectCall}
                                className="p-4 bg-red-600 rounded-full hover:bg-red-700"
                            >
                                <Phone size={24} className="transform rotate-[135deg]" />
                            </button>
                            <button
                                onClick={acceptCall}
                                className="p-4 bg-green-500 rounded-full hover:bg-green-600 animate-bounce"
                            >
                                <Phone size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Call UI */}
            {(callState === 'CONNECTED' || callState === 'OUTGOING') && (
                <CallInterface />
            )}
        </div>
    );
};
