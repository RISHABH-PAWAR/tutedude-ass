export const PROXIMITY_RADIUS = 150;

export const distance = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const getRoomId = (idA, idB) =>
  [idA, idB].sort().join('_');

export const calculateProximityChanges = (usersMap) => {
  const ids = Array.from(usersMap.keys());
  const toConnect = [];
  const toDisconnect = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = usersMap.get(ids[i]);
      const b = usersMap.get(ids[j]);
      if (!a || !b) continue;

      const dist = distance(a, b);
      const connected = a.connections.has(ids[j]);

      if (dist < PROXIMITY_RADIUS && !connected) {
        toConnect.push({ a, b });
      } else if (dist >= PROXIMITY_RADIUS && connected) {
        toDisconnect.push({ a, b });
      }
    }
  }

  return { toConnect, toDisconnect };
};
