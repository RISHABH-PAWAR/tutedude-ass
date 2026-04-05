import { useEffect } from 'react';
import { connectSocket, getSocket } from '../socket/socketClient.js';
import useCosmosStore from '../store/cosmosStore.js';

export const useSocket = () => {
  const {
    setMySocketId, setHasJoined, setUsers,
    addConnection, removeConnection,
    addMessage, setMessages,
    setIsConnecting,
  } = useCosmosStore();

  useEffect(() => {
    const socket = connectSocket();

    // Named handlers so we can remove exactly these references on cleanup
    const onConnect = () => {
      setMySocketId(socket.id);
    };

    const onUserJoined = ({ userId, username, x, y, allUsers }) => {
      console.log('User joined successfully:', { userId, username, x, y });
      setMySocketId(userId);
      useCosmosStore.getState().setMyPosition({ x, y });
      setUsers(allUsers);
      setHasJoined(true);
      setIsConnecting(false);
    };

    const onPositionBroadcast = ({ users }) => {
      setUsers(users);
    };

    const onUserDisconnected = ({ socketId }) => {
      setUsers(useCosmosStore.getState().users.filter(u => u.socketId !== socketId));
    };

    const onProximityConnect = ({ roomId, peerId, peerName }) => {
      addConnection({ roomId, peerId, peerName });
      socket.emit('chat:request_history', { roomId });
    };

    const onProximityDisconnect = ({ roomId }) => {
      removeConnection({ roomId });
    };

    const onChatReceive = ({ roomId, senderId, senderName, text, timestamp }) => {
      addMessage({ roomId, message: { senderId, senderName, text, timestamp } });
    };

    const onChatHistory = ({ roomId, messages }) => {
      setMessages({ roomId, messages });
    };

    const onDisconnect = () => {
      setHasJoined(false);
    };

    socket.on('connect', onConnect);
    socket.on('user:joined', onUserJoined);
    socket.on('position:broadcast', onPositionBroadcast);
    socket.on('user:disconnected', onUserDisconnected);
    socket.on('proximity:connect', onProximityConnect);
    socket.on('proximity:disconnect', onProximityDisconnect);
    socket.on('chat:receive', onChatReceive);
    socket.on('chat:history', onChatHistory);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('user:joined', onUserJoined);
      socket.off('position:broadcast', onPositionBroadcast);
      socket.off('user:disconnected', onUserDisconnected);
      socket.off('proximity:connect', onProximityConnect);
      socket.off('proximity:disconnect', onProximityDisconnect);
      socket.off('chat:receive', onChatReceive);
      socket.off('chat:history', onChatHistory);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return getSocket();
};
