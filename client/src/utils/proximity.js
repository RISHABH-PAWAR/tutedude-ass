import { PROXIMITY_RADIUS } from '../constants/config.js';

export const distance = (userA, userB) => {
  const dx = userA.x - userB.x;
  const dy = userA.y - userB.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const isNear = (userA, userB) =>
  distance(userA, userB) < PROXIMITY_RADIUS;

export const getRoomId = (idA, idB) =>
  [idA, idB].sort().join('_');
