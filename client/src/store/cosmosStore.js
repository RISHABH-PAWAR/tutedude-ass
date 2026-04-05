import { create } from 'zustand';

const useCosmosStore = create((set, get) => ({
  mySocketId: null,
  myUsername: '',
  hasJoined: false,
  myPosition: { x: 400, y: 300 },
  users: [],
  connections: [],
  activeRoomId: null,
  messages: {},
  isConnecting: false,

  // Media state
  isMicOn: true,
  isCameraOn: false,
  localStream: null,
  remoteStreams: {},   // peerId → MediaStream

  setMySocketId: (id) => set({ mySocketId: id }),
  setMyUsername: (name) => set({ myUsername: name }),
  setHasJoined: (bool) => set({ hasJoined: bool }),
  setIsConnecting: (bool) => set({ isConnecting: bool }),
  setMyPosition: ({ x, y }) => set({ myPosition: { x, y } }),
  setUsers: (users) => set({ users }),

  setIsMicOn: (v) => set({ isMicOn: v }),
  setIsCameraOn: (v) => set({ isCameraOn: v }),
  setLocalStream: (stream) => set({ localStream: stream }),
  addRemoteStream: (peerId, stream) =>
    set(s => ({ remoteStreams: { ...s.remoteStreams, [peerId]: stream } })),
  removeRemoteStream: (peerId) =>
    set(s => {
      const next = { ...s.remoteStreams };
      delete next[peerId];
      return { remoteStreams: next };
    }),

  addConnection: ({ roomId, peerId, peerName }) => {
    if (get().connections.find(c => c.roomId === roomId)) return;
    set(s => ({ connections: [...s.connections, { roomId, peerId, peerName }], activeRoomId: roomId }));
  },
  removeConnection: ({ roomId }) => {
    set(s => {
      const next = s.connections.filter(c => c.roomId !== roomId);
      return { connections: next, activeRoomId: next.length > 0 ? next[next.length - 1].roomId : null };
    });
  },
  setActiveRoomId: (roomId) => set({ activeRoomId: roomId }),

  addMessage: ({ roomId, message }) =>
    set(s => ({ messages: { ...s.messages, [roomId]: [...(s.messages[roomId] || []), message] } })),
  setMessages: ({ roomId, messages }) =>
    set(s => ({ messages: { ...s.messages, [roomId]: messages } })),

  reset: () => set({
    mySocketId: null, myUsername: '', hasJoined: false, isConnecting: false,
    myPosition: { x: 400, y: 300 }, users: [], connections: [], activeRoomId: null,
    messages: {}, isMicOn: true, isCameraOn: false, localStream: null, remoteStreams: {},
  }),
}));

export default useCosmosStore;
