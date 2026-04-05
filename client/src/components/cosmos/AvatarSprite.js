import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { AVATAR_RADIUS, PROXIMITY_RADIUS } from '../../constants/config.js';
import { getAvatarColor } from '../../utils/avatarColor.js';
import { getAvatarStyle } from '../../utils/avatarStyle.js';

function drawHair(g, style, color, R) {
  switch (style) {
    case 0: // Short/neat cap
      g.ellipse(0, -R * 0.58, R * 0.88, R * 0.52).fill({ color });
      g.rect(-R * 0.82, -R * 0.82, R * 1.64, R * 0.38).fill({ color });
      break;
    case 1: // Long with side curtains (back is drawn separately)
      g.ellipse(0, -R * 0.55, R * 0.88, R * 0.52).fill({ color });
      break;
    case 2: // Spiky
      for (let i = 0; i < 5; i++) {
        const bx = -R * 0.75 + i * R * 0.375;
        const by = -R * 0.75;
        const ty = -R * 1.5 - (i % 2 === 0 ? R * 0.22 : 0);
        g.poly([bx - R * 0.18, by, bx + R * 0.18, by, bx, ty]).fill({ color });
      }
      break;
    case 3: // Afro — drawn as backGraphic, skip here
      break;
    case 4: // Bun
      g.ellipse(0, -R * 0.55, R * 0.85, R * 0.5).fill({ color });
      g.circle(0, -R * 1.22, R * 0.38).fill({ color });
      break;
    case 5: // Twin puffs
      g.circle(-R * 0.44, -R * 1.08, R * 0.4).fill({ color });
      g.circle(R * 0.44, -R * 1.08, R * 0.4).fill({ color });
      g.ellipse(0, -R * 0.55, R * 0.82, R * 0.48).fill({ color });
      break;
  }
}

function drawCartoonFace(back, face, style, bodyColor, R) {
  const { skin, hair, hairStyle, eyeColor, hasGlasses } = style;

  // --- back layer: afro behind head, long hair sides, shirt, neck ---
  if (hairStyle === 3) {
    back.circle(0, -R * 0.3, R * 1.12).fill({ color: hair }); // afro
  }
  if (hairStyle === 1) {
    back.ellipse(-R * 0.86, R * 0.22, R * 0.22, R * 0.72).fill({ color: hair });
    back.ellipse(R * 0.86, R * 0.22, R * 0.22, R * 0.72).fill({ color: hair });
  }
  // shirt / body peeking below
  back.circle(0, R + R * 0.62, R * 0.88).fill({ color: bodyColor });
  // neck
  back.rect(-R * 0.22, R * 0.76, R * 0.44, R * 0.34).fill({ color: skin });

  // --- face layer ---
  // Ears
  face.circle(-R, 0, R * 0.3).fill({ color: skin });
  face.circle(R, 0, R * 0.3).fill({ color: skin });
  // Head
  face.circle(0, 0, R).fill({ color: skin });
  // Eyes — whites
  face.ellipse(-R * 0.31, -R * 0.12, R * 0.2, R * 0.25).fill({ color: 0xFFFFFF });
  face.ellipse(R * 0.31, -R * 0.12, R * 0.2, R * 0.25).fill({ color: 0xFFFFFF });
  // Pupils
  face.circle(-R * 0.31, -R * 0.08, R * 0.13).fill({ color: eyeColor });
  face.circle(R * 0.31, -R * 0.08, R * 0.13).fill({ color: eyeColor });
  // Eye shine
  face.circle(-R * 0.26, -R * 0.14, R * 0.05).fill({ color: 0xFFFFFF });
  face.circle(R * 0.36, -R * 0.14, R * 0.05).fill({ color: 0xFFFFFF });
  // Smile arc (zig-zag approximation)
  const smY = R * 0.28;
  const smW = R * 0.36;
  face.moveTo(-smW, smY);
  for (let a = 0.05; a <= Math.PI - 0.05; a += 0.18) {
    face.lineTo(-smW + (a / Math.PI) * smW * 2, smY + Math.sin(a) * R * 0.18);
  }
  face.stroke({ color: 0xAA6655, width: R * 0.1, cap: 'round' });
  // Blush
  face.ellipse(-R * 0.6, R * 0.22, R * 0.2, R * 0.12).fill({ color: 0xFF9999, alpha: 0.38 });
  face.ellipse(R * 0.6, R * 0.22, R * 0.2, R * 0.12).fill({ color: 0xFF9999, alpha: 0.38 });
  // Hair (front)
  if (hairStyle !== 3) drawHair(face, hairStyle, hair, R);
  // Glasses
  if (hasGlasses) {
    face.circle(-R * 0.31, -R * 0.12, R * 0.25).stroke({ color: 0x333355, width: R * 0.07 });
    face.circle(R * 0.31, -R * 0.12, R * 0.25).stroke({ color: 0x333355, width: R * 0.07 });
    face.moveTo(-R * 0.06, -R * 0.12).lineTo(R * 0.06, -R * 0.12)
      .stroke({ color: 0x333355, width: R * 0.06 });
    face.moveTo(-R * 0.56, -R * 0.12).lineTo(-R * 0.82, -R * 0.08)
      .moveTo(R * 0.56, -R * 0.12).lineTo(R * 0.82, -R * 0.08)
      .stroke({ color: 0x333355, width: R * 0.055 });
  }
}

export class AvatarSprite {
  constructor({ username, socketId, isSelf = false }) {
    this.username = username;
    this.socketId = socketId;
    this.isSelf = isSelf;
    this.color = getAvatarColor(username);
    this.style = getAvatarStyle(username);
    this._wasConnected = false;

    this.container = new Container();
    this._build();
  }

  _build() {
    const R = AVATAR_RADIUS;
    this.glow = new Graphics();
    this.glow.alpha = 0;
    this.container.addChild(this.glow);

    this.ring = new Graphics();
    this.ring.alpha = 0;
    this.container.addChild(this.ring);

    // Self indicator ring
    if (this.isSelf) {
      const selfRing = new Graphics();
      selfRing.circle(0, 0, R + 5).stroke({ color: 0x00E87A, width: 2, alpha: 0.7 });
      this.container.addChild(selfRing);
    }

    this.back = new Graphics();
    this.container.addChild(this.back);

    this.face = new Graphics();
    this.container.addChild(this.face);

    const labelStyle = new TextStyle({
      fontFamily: 'DM Sans, system-ui, sans-serif',
      fontSize: 11,
      fontWeight: '600',
      fill: '#cccccc',
      dropShadow: { color: '#000000', blur: 4, distance: 1, alpha: 0.9 },
    });
    this.label = new Text({ text: this.username, style: labelStyle });
    this.label.anchor.set(0.5, 0);
    this.label.y = R + 8;
    this.container.addChild(this.label);

    this._drawAvatar(false);
  }

  _drawAvatar(connected) {
    this.back.clear();
    this.face.clear();
    const R = AVATAR_RADIUS;

    // Connected highlight ring on body
    if (connected && !this.isSelf) {
      this.back.circle(0, 0, R + 4).stroke({ color: 0x00E87A, width: 2.5, alpha: 0.9 });
    }

    drawCartoonFace(this.back, this.face, this.style, this.color, R);
  }

  _drawRing(show) {
    this.ring.clear();
    if (!show) return;
    const segments = 48;
    for (let i = 0; i < segments; i++) {
      if (i % 3 === 2) continue;
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 0.75) / segments) * Math.PI * 2;
      this.ring
        .moveTo(Math.cos(a1) * PROXIMITY_RADIUS, Math.sin(a1) * PROXIMITY_RADIUS)
        .lineTo(Math.cos(a2) * PROXIMITY_RADIUS, Math.sin(a2) * PROXIMITY_RADIUS);
    }
    this.ring.stroke({ color: 0x00E87A, width: 1, alpha: 0.35 });
  }

  _drawGlow(connected) {
    this.glow.clear();
    if (!connected && !this.isSelf) return;
    const glowColor = connected ? 0x00E87A : 0x6366f1;
    const glowAlpha = connected ? 0.14 : 0.07;
    this.glow.circle(0, 0, AVATAR_RADIUS + 20).fill({ color: glowColor, alpha: glowAlpha });
  }

  update(x, y, isConnected = false) {
    this.container.x = x;
    this.container.y = y;
    if (isConnected !== this._wasConnected) {
      this._drawAvatar(isConnected);
      this._wasConnected = isConnected;
    }
    this._drawRing(this.isSelf || isConnected);
    this._drawGlow(isConnected);
    this.ring.alpha = isConnected ? 1 : this.isSelf ? 0.5 : 0;
    this.glow.alpha = isConnected ? 1 : this.isSelf ? 0.55 : 0;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
