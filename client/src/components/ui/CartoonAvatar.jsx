import { getAvatarStyle } from '../../utils/avatarStyle.js';
import { getAvatarColor } from '../../utils/avatarColor.js';

// Convert 0xRRGGBB → '#rrggbb'
const hex = n => `#${n.toString(16).padStart(6, '0')}`;

const CartoonAvatar = ({ username = '', size = 90 }) => {
  if (!username) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: '2px dashed rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#333', fontSize: 22,
      }}>
        ?
      </div>
    );
  }

  const style = getAvatarStyle(username);
  const bodyColor = hex(getAvatarColor(username));
  const skin = hex(style.skin);
  const hair = hex(style.hair);
  const eye = hex(style.eyeColor);
  const R = 36; // SVG radius
  const S = 100; // viewBox size
  const cx = 50, cy = 46; // center

  const hairPaths = () => {
    switch (style.hairStyle) {
      case 0: // Short cap
        return <>
          <ellipse cx={cx} cy={cy - R * 0.58} rx={R * 0.88} ry={R * 0.52} fill={hair} />
          <rect x={cx - R * 0.82} y={cy - R * 0.82} width={R * 1.64} height={R * 0.38} fill={hair} />
        </>;
      case 1: // Long
        return <>
          <ellipse cx={cx - R * 0.86} cy={cy + R * 0.22} rx={R * 0.22} ry={R * 0.72} fill={hair} />
          <ellipse cx={cx + R * 0.86} cy={cy + R * 0.22} rx={R * 0.22} ry={R * 0.72} fill={hair} />
          <ellipse cx={cx} cy={cy - R * 0.55} rx={R * 0.88} ry={R * 0.52} fill={hair} />
        </>;
      case 2: // Spiky
        return Array.from({ length: 5 }, (_, i) => {
          const bx = cx - R * 0.75 + i * R * 0.375;
          const by = cy - R * 0.75;
          const ty = cy - R * 1.5 - (i % 2 === 0 ? R * 0.22 : 0);
          return <polygon key={i} points={`${bx - R * 0.18},${by} ${bx + R * 0.18},${by} ${bx},${ty}`} fill={hair} />;
        });
      case 3: // Afro
        return <circle cx={cx} cy={cy - R * 0.3} r={R * 1.12} fill={hair} />;
      case 4: // Bun
        return <>
          <ellipse cx={cx} cy={cy - R * 0.55} rx={R * 0.85} ry={R * 0.5} fill={hair} />
          <circle cx={cx} cy={cy - R * 1.22} r={R * 0.38} fill={hair} />
        </>;
      case 5: // Twin puffs
        return <>
          <circle cx={cx - R * 0.44} cy={cy - R * 1.08} r={R * 0.4} fill={hair} />
          <circle cx={cx + R * 0.44} cy={cy - R * 1.08} r={R * 0.4} fill={hair} />
          <ellipse cx={cx} cy={cy - R * 0.55} rx={R * 0.82} ry={R * 0.48} fill={hair} />
        </>;
      default: return null;
    }
  };

  const smilePoints = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 9) * Math.PI;
    return `${cx - R * 0.36 + (i / 9) * R * 0.72},${cy + R * 0.28 + Math.sin(a) * R * 0.18}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${S} ${S}`} style={{ borderRadius: '50%' }}>
      {/* Shirt */}
      <circle cx={cx} cy={cy + R + R * 0.62} r={R * 0.88} fill={bodyColor} />
      {/* Neck */}
      <rect x={cx - R * 0.22} y={cy + R * 0.76} width={R * 0.44} height={R * 0.34} fill={skin} />
      {/* Hair back (long/afro) */}
      {(style.hairStyle === 1 || style.hairStyle === 3) && hairPaths()}
      {/* Ears */}
      <circle cx={cx - R} cy={cy} r={R * 0.3} fill={skin} />
      <circle cx={cx + R} cy={cy} r={R * 0.3} fill={skin} />
      {/* Head */}
      <circle cx={cx} cy={cy} r={R} fill={skin} />
      {/* Eyes */}
      <ellipse cx={cx - R * 0.31} cy={cy - R * 0.12} rx={R * 0.2} ry={R * 0.25} fill="white" />
      <ellipse cx={cx + R * 0.31} cy={cy - R * 0.12} rx={R * 0.2} ry={R * 0.25} fill="white" />
      <circle cx={cx - R * 0.31} cy={cy - R * 0.08} r={R * 0.13} fill={eye} />
      <circle cx={cx + R * 0.31} cy={cy - R * 0.08} r={R * 0.13} fill={eye} />
      <circle cx={cx - R * 0.26} cy={cy - R * 0.14} r={R * 0.05} fill="white" />
      <circle cx={cx + R * 0.36} cy={cy - R * 0.14} r={R * 0.05} fill="white" />
      {/* Smile */}
      <polyline points={smilePoints} fill="none" stroke="#AA6655" strokeWidth={R * 0.1} strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx={cx - R * 0.6} cy={cy + R * 0.22} rx={R * 0.2} ry={R * 0.12} fill="#FF9999" fillOpacity={0.4} />
      <ellipse cx={cx + R * 0.6} cy={cy + R * 0.22} rx={R * 0.2} ry={R * 0.12} fill="#FF9999" fillOpacity={0.4} />
      {/* Hair front (short/spiky/bun/puffs) */}
      {style.hairStyle !== 1 && style.hairStyle !== 3 && hairPaths()}
      {/* Glasses */}
      {style.hasGlasses && <>
        <circle cx={cx - R * 0.31} cy={cy - R * 0.12} r={R * 0.25} fill="none" stroke="#333355" strokeWidth={R * 0.07} />
        <circle cx={cx + R * 0.31} cy={cy - R * 0.12} r={R * 0.25} fill="none" stroke="#333355" strokeWidth={R * 0.07} />
        <line x1={cx - R * 0.06} y1={cy - R * 0.12} x2={cx + R * 0.06} y2={cy - R * 0.12} stroke="#333355" strokeWidth={R * 0.06} />
      </>}
    </svg>
  );
};

export default CartoonAvatar;
