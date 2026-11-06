import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './api';

export const getSocketBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

let socketInstance: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socketInstance) {
    const socketUrl = getSocketBaseUrl();

    let authToken = token;
    if (!authToken && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      if (match && match[1]) {
        authToken = match[1];
      }
    }

    socketInstance = io(socketUrl, {
      withCredentials: true,
      auth: {
        token: authToken,
      },
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      // Socket connected
    });

    socketInstance.on('connect_error', (err) => {
      // Handled gracefully in UI
    });
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

