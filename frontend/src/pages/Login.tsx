import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { SocketService } from '../services/socket';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
            const payload = isRegister
                ? { email, password, name: email.split('@')[0] }
                : { email, password };

            // Assuming proxy or CORS set up
            const res = await axios.post(`http://localhost:8080${endpoint}`, payload);
            const { token } = res.data;

            login(token, email);
            SocketService.getInstance().connect(token);
            navigate('/');
        } catch (error) {
            console.error('Auth Error', error);
            alert('Authentication failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-darker">
            <div className="p-8 bg-dark rounded-lg shadow-xl w-96">
                <h1 className="text-2xl text-white mb-6 font-bold text-center">
                    {isRegister ? 'Register' : 'Login'}
                </h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-2 rounded bg-gray-700 text-white border-transparent focus:border-primary border-2 outline-none"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-2 rounded bg-gray-700 text-white border-transparent focus:border-primary border-2 outline-none"
                    />
                    <button type="submit" className="p-2 bg-secondary text-darker font-bold rounded hover:bg-opacity-90 transition">
                        {isRegister ? 'Register' : 'Login'}
                    </button>
                </form>
                <div className="mt-4 text-center text-gray-400 text-sm">
                    <span
                        className="cursor-pointer hover:text-white"
                        onClick={() => setIsRegister(!isRegister)}
                    >
                        {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                    </span>
                </div>
            </div>
        </div>
    );
};
