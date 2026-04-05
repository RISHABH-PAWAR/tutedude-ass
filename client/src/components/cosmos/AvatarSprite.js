import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { AVATAR_RADIUS, PROXIMITY_RADIUS } from '../../constants/config.js';
import { getAvatarColor } from '../../utils/avatarColor.js';

export class AvatarSprite {
  constructor({ username, socketId, isSelf = false }) {
    this.username = username;
    this.socketId = socketId;
    this.isSelf = isSelf;
    this.color = getAvatarColor(username);
    this._wasConnected = false;

    this.container = new Container();
    this._build();
  }

  _build() {
    this.ring = new Graphics();
    this.ring.alpha = 0;
    this.container.addChild(this.ring);

    this.glow = new Graphics();
    this.glow.alpha = 0;
    this.container.addChild(this.glow);

    // Body Graphics — only paths go here, never any Text children
    this.body = new Graphics();
    this.container.addChild(this.body);

    // Initial letter — created ONCE here, never touched again during updates
    const letterStyle = new TextStyle({
      fontFamily: 'DM Sans, system-ui, sans-serif',
      fontSize: 15,
      fontWeight: '700',
      fill: '#050505',
    });
    this.letter = new Text({ text: (this.username || '').charAt(0).toUpperCase(), style: letterStyle });
    this.letter.anchor.set(0.5, 0.5);
    this.container.addChild(this.letter);

    // Username label below the circle
    const labelStyle = new TextStyle({
      fontFamily: 'DM Sans, system-ui, sans-serif',
      fontSize: 11,
      fontWeight: '600',
      fill: '#cccccc',
      dropShadow: { color: '#000000', blur: 4, distance: 1, alpha: 0.9 },
    });
    this.label = new Text({ text: this.username, style: labelStyle });
    this.label.anchor.set(0.5, 0);
    this.label.y = AVATAR_RADIUS + 7;
    this.container.addChild(this.label);

    this._drawBody(false);
  }

  _drawBody(connected) {
    // ONLY Graphics paths — zero Text creation, zero addChild calls
    this.body.clear();

    if (this.isSelf) {
      this.body
        .circle(0, 0, AVATAR_RADIUS + 5)
        .fill({ color: 0xffffff, alpha: 0.08 });
      this.body
        .circle(0, 0, AVATAR_RADIUS + 3)
        .stroke({ color: 0x00E87A, width: 1.5, alpha: 0.7 });
    }

    if (connected && !this.isSelf) {
      this.body
        .circle(0, 0, AVATAR_RADIUS + 3)
        .stroke({ color: 0x00E87A, width: 2, alpha: 0.9 });
    }

    this.body
      .circle(0, 0, AVATAR_RADIUS)
      .fill({ color: this.color });
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

    this.glow
      .circle(0, 0, AVATAR_RADIUS + 18)
      .fill({ color: glowColor, alpha: glowAlpha });
  }

  update(x, y, isConnected = false) {
    this.container.x = x;
    this.container.y = y;

    // Only redraw body Graphics when connection state actually flips
    if (isConnected !== this._wasConnected) {
      this._drawBody(isConnected);
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
