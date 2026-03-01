import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './useAuth';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const { token, user } = useAuth();
  
  useEffect(() => {
    if (!token || !user) return;
    
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socketInstance.on('connect', () => {
      console.log('Socket connected');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, [token, user]);
  
  return socket;
};