import { create } from 'zustand';
// axios is imported but not used in the snippet provided

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
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    login: (token: string, email: string) => {
        const normalizedEmail = email.toLowerCase();
        const user = { id: 0, email: normalizedEmail, name: normalizedEmail.split('@')[0] };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, user });
    },
    register: (_name: string, _email: string) => {
        // ...
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null });
    },
}));
