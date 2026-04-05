const users = new Map();

export const addUser = (socketId, username, x, y) => {
  users.set(socketId, { socketId, username, x, y, connections: new Set() });
};

export const removeUser = (socketId) => users.delete(socketId);

export const updatePosition = (socketId, x, y) => {
  const user = users.get(socketId);
  if (user) { user.x = x; user.y = y; }
};

export const getUser = (socketId) => users.get(socketId);

export const getAllUsers = () =>
  Array.from(users.values()).map(u => ({
    socketId: u.socketId,
    username: u.username,
    x: u.x,
    y: u.y,
  }));

export const getAllUsersRaw = () => users;

export const addConnection = (a, b) => {
  const ua = users.get(a);
  const ub = users.get(b);
  if (ua) ua.connections.add(b);
  if (ub) ub.connections.add(a);
};

export const removeConnection = (a, b) => {
  const ua = users.get(a);
  const ub = users.get(b);
  if (ua) ua.connections.delete(b);
  if (ub) ub.connections.delete(a);
};

export const getUserCount = () => users.size;
