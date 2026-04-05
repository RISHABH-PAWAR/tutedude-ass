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

  setMySocketId: (id) => set({ mySocketId: id }),
  setMyUsername: (name) => set({ myUsername: name }),
  setHasJoined: (bool) => set({ hasJoined: bool }),
  setIsConnecting: (bool) => set({ isConnecting: bool }),

  setMyPosition: ({ x, y }) => set({ myPosition: { x, y } }),

  setUsers: (users) => set({ users }),

  addConnection: ({ roomId, peerId, peerName }) => {
    const existing = get().connections.find(c => c.roomId === roomId);
    if (existing) return;
    set(state => ({
      connections: [...state.connections, { roomId, peerId, peerName }],
      activeRoomId: roomId,
    }));
  },

  removeConnection: ({ roomId }) => {
    set(state => {
      const next = state.connections.filter(c => c.roomId !== roomId);
      return {
        connections: next,
        activeRoomId: next.length > 0 ? next[next.length - 1].roomId : null,
      };
    });
  },

  setActiveRoomId: (roomId) => set({ activeRoomId: roomId }),

  addMessage: ({ roomId, message }) => {
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    }));
  },

  setMessages: ({ roomId, messages }) => {
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: messages,
      },
    }));
  },

  reset: () => set({
    mySocketId: null,
    myUsername: '',
    hasJoined: false,
    isConnecting: false,
    myPosition: { x: 400, y: 300 },
    users: [],
    connections: [],
    activeRoomId: null,
    messages: {},
  }),
}));

export default useCosmosStore;
