import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io('/', { autoConnect: true, transports: ['websocket', 'polling'] });

    socket.on('connect', () => console.log('Socket connected:', socket.id));
    socket.on('disconnect', () => console.log('Socket disconnected'));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinLocation = (locationId) => {
  if (socket) socket.emit('join_location', locationId);
};

export const leaveLocation = (locationId) => {
  if (socket) socket.emit('leave_location', locationId);
};
