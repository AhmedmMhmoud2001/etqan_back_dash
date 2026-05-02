import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../api';

const SocketContext = createContext({ socket: null, connected: false });

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const backend = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
    const socketUrl =
      backend || (import.meta.env.DEV ? '' : window.location.origin);
    const s = io(socketUrl, {
      path: '/socket.io',
      auth: { token },
      // في بعض إعدادات Nginx/Proxy قد يفشل websocket upgrade (wss) بينما polling يعمل.
      // نبدأ بـ polling ثم نسمح بالترقية إن كانت متاحة لتقليل أخطاء الكونسول.
      transports: ['polling', 'websocket'],
    });
    setSocket(s);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', () => setConnected(false));

    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
