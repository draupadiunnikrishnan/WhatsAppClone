import { WS_BASE_URL } from '../config';

export class SocketService {
    private socket: WebSocket | null = null;
    private listeners: Map<String, Function[]> = new Map();
    private static instance: SocketService;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect(token: string) {
        if (this.socket) return;

        // WS URL - change to wss:// for production
        const url = `${WS_BASE_URL}/ws?token=${token}`;
        console.log('Connecting to WebSocket:', url);
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log('WebSocket Connected');
            this.emit('connectionChange', true);
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.emit(message.type, message);
        };

        this.socket.onclose = () => {
            console.log('WebSocket Disconnected. Retrying in 3s...');
            this.emit('connectionChange', false);
            this.socket = null;
            setTimeout(() => this.connect(token), 3000);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket Error', error);
        };
    }

    public isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    public send(type: string, payload: any, recipientId: string, senderId: string) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload, recipientId, senderId }));
        } else {
            console.warn('Socket not connected');
        }
    }

    public on(type: string, callback: Function) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)?.push(callback);
    }

    public off(type: string, callback: Function) {
        if (!this.listeners.has(type)) return;
        const callbacks = this.listeners.get(type)?.filter(cb => cb !== callback);
        this.listeners.set(type, callbacks || []);
    }

    private emit(type: string, data: any) {
        this.listeners.get(type)?.forEach(cb => cb(data));
        // Also emit wildcard or specific handlers if needed
    }

    public disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}
