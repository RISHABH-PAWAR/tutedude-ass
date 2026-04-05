// Deterministic hash from username string
export function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return h >>> 0;
}

export const SKIN_TONES = [
  0xFFDAB9, // peach
  0xF5CBA7, // warm tan
  0xE8A07A, // golden
  0xC68642, // brown
  0x8D5524, // dark brown
  0xFFC0D0, // rosy (fantasy)
  0xB5EAD7, // mint (fantasy)
  0xC7CEEA, // lavender (fantasy)
];

export const HAIR_COLORS = [
  0x1A0A00, // black
  0x4B2E16, // dark brown
  0xDAA520, // blonde
  0xE83A3A, // red
  0x8B5CF6, // purple
  0x00E87A, // neon green
  0x3B82F6, // blue
  0xF97316, // orange
];

// 0=short/neat 1=long 2=spiky 3=afro 4=bun 5=twin-puffs
export const HAIR_STYLES = 6;

export function getAvatarStyle(username = '?') {
  const h = djb2(username);
  return {
    skin:       SKIN_TONES[h % SKIN_TONES.length],
    hair:       HAIR_COLORS[(h >> 4) % HAIR_COLORS.length],
    hairStyle:  (h >> 8) % HAIR_STYLES,
    hasGlasses: ((h >> 12) % 5) === 0,
    eyeColor:   ((h >> 16) % 3) === 0 ? 0x3B82F6 : 0x2C1810,
  };
}
