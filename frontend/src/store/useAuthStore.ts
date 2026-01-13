import { create } from 'zustand';
import axios from 'axios';

interface User {
    id: number;
    email: string;
    name: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    login: (token: string, email: string) => void;
    register: (name: string, email: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null, // In a real app, you'd decode the JWT to get initial user info or fetch /me
    token: localStorage.getItem('token'),
    login: (token: string, email: string) => {
        localStorage.setItem('token', token);
        // Simple mock user set for now, in prod decode JWT or fetch profile
        set({ token, user: { id: 0, email, name: email.split('@')[0] } });
    },
    register: (name: string, email: string) => {
        // Logic handled in component usually, but store can hold state
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
    },
}));
