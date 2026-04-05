import { AVATAR_COLORS } from '../constants/config.js';

export const getAvatarColor = (username = '') => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const getAvatarColorHex = (username = '') => {
  const n = getAvatarColor(username);
  return `#${n.toString(16).padStart(6, '0')}`;
};
