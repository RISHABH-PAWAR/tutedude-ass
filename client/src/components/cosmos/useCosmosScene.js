import { useEffect, useRef } from 'react';
import { Application, Graphics } from 'pixi.js';
import { AvatarSprite } from './AvatarSprite.js';
import { getSocket } from '../../socket/socketClient.js';
import useCosmosStore from '../../store/cosmosStore.js';
import { useKeyboard } from '../../hooks/useKeyboard.js';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  MOVE_SPEED, POSITION_THROTTLE_MS,
  AVATAR_RADIUS,
} from '../../constants/config.js';

/* ─── Star data ──────────────────────────────────────────────────── */
function buildStars() {
  const stars = [];
  const rng = (min, max) => Math.random() * (max - min) + min;
  // Tiny dim stars
  for (let i = 0; i < 220; i++) {
    stars.push({
      x: rng(0, CANVAS_WIDTH), y: rng(0, CANVAS_HEIGHT),
      r: rng(0.5, 1.5), baseAlpha: rng(0.15, 0.55),
      speed: rng(0.003, 0.012), phase: rng(0, Math.PI * 2),
      bright: false,
    });
  }
  // Bright hero stars
  for (let i = 0; i < 35; i++) {
    stars.push({
      x: rng(0, CANVAS_WIDTH), y: rng(0, CANVAS_HEIGHT),
      r: rng(1.5, 3), baseAlpha: rng(0.5, 0.9),
      speed: rng(0.005, 0.018), phase: rng(0, Math.PI * 2),
      bright: true,
    });
  }
  return stars;
}

function _drawBackground(app, starsRef) {
  // Static layer — nebula + grid
  const bg = new Graphics();

  // Deep-space base
  bg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).fill({ color: 0x030311 });

  // Nebula patches
  const nebulae = [
    { x: CANVAS_WIDTH * 0.2, y: CANVAS_HEIGHT * 0.3, rx: 320, ry: 240, color: 0x00E87A, alpha: 0.025 },
    { x: CANVAS_WIDTH * 0.75, y: CANVAS_HEIGHT * 0.6, rx: 280, ry: 200, color: 0x6366f1, alpha: 0.03 },
    { x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT * 0.8, rx: 350, ry: 180, color: 0x3b82f6, alpha: 0.022 },
    { x: CANVAS_WIDTH * 0.85, y: CANVAS_HEIGHT * 0.15, rx: 200, ry: 160, color: 0xa855f7, alpha: 0.025 },
  ];
  for (const n of nebulae) {
    bg.ellipse(n.x, n.y, n.rx, n.ry).fill({ color: n.color, alpha: n.alpha });
  }

  // Faint cyan-tinted grid
  const gs = 52;
  const cols = Math.ceil(CANVAS_WIDTH / gs);
  const rows = Math.ceil(CANVAS_HEIGHT / gs);
  for (let i = 0; i <= cols; i++) bg.moveTo(i * gs, 0).lineTo(i * gs, CANVAS_HEIGHT);
  for (let j = 0; j <= rows; j++) bg.moveTo(0, j * gs).lineTo(CANVAS_WIDTH, j * gs);
  bg.stroke({ color: 0x00ccff, width: 0.4, alpha: 0.018 });

  // Centre proximity rings
  const cx = CANVAS_WIDTH / 2, cy = CANVAS_HEIGHT / 2;
  for (let r = 150; r <= 600; r += 150) {
    bg.circle(cx, cy, r).stroke({ color: 0x00E87A, width: 0.5, alpha: 0.025 });
  }

  app.stage.addChild(bg);

  // Animated star layer — individual Graphics per star for alpha control
  const starGraphics = buildStars().map(s => {
    const g = new Graphics();
    if (s.bright) {
      // Cross glow for bright stars
      g.rect(-s.r * 3, -0.4, s.r * 6, 0.8).fill({ color: 0xffffff, alpha: 0.35 });
      g.rect(-0.4, -s.r * 3, 0.8, s.r * 6).fill({ color: 0xffffff, alpha: 0.35 });
    }
    g.circle(0, 0, s.r).fill({ color: s.bright ? 0xffffff : 0xaaddff });
    g.x = s.x;
    g.y = s.y;
    g.alpha = s.baseAlpha;
    app.stage.addChild(g);
    return { g, ...s };
  });

  starsRef.current = starGraphics;
}

/* ─── Sprite sync ─────────────────────────────────────────────────── */
const syncSpritesToStage = ({ app, sprites, state }) => {
  if (!app?.stage) return;
  const { mySocketId, myPosition, users, connections } = state;
  const connectedIds = new Set(connections.map(c => c.peerId));

  for (const [id, sprite] of sprites.entries()) {
    if (!users.find(u => u.socketId === id)) { sprite.destroy(); sprites.delete(id); }
  }
  for (const user of users) {
    const isSelf = user.socketId === mySocketId;
    const pos = isSelf ? myPosition : user;
    if (!sprites.has(user.socketId)) {
      const sprite = new AvatarSprite({ username: user.username, socketId: user.socketId, isSelf });
      app.stage.addChild(sprite.container);
      sprites.set(user.socketId, sprite);
    }
    sprites.get(user.socketId)?.update(pos.x, pos.y, connectedIds.has(user.socketId));
  }
};

/* ─── Hook ────────────────────────────────────────────────────────── */
export const useCosmosScene = (canvasRef) => {
  const appRef = useRef(null);
  const spritesRef = useRef(new Map());
  const starsRef = useRef([]);
  const lastEmitRef = useRef(0);
  const keysRef = useKeyboard();

  // PixiJS init
  useEffect(() => {
    if (!canvasRef.current) return;
    let destroyed = false;
    const app = new Application();

    (async () => {
      try {
        await app.init({
          canvas: canvasRef.current,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: 0x030311,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });
        if (destroyed) { app.destroy({ removeView: false, children: true }); return; }
        appRef.current = app;
        _drawBackground(app, starsRef);
        syncSpritesToStage({ app, sprites: spritesRef.current, state: useCosmosStore.getState() });
      } catch (e) {
        if (!destroyed) appRef.current = null;
      }
    })();

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy({ removeView: false, children: true });
        appRef.current = null;
      }
      spritesRef.current.clear();
      starsRef.current = [];
    };
  }, []);

  // Sprite sync on store change
  useEffect(() => {
    const unsub = useCosmosStore.subscribe(state =>
      syncSpritesToStage({ app: appRef.current, sprites: spritesRef.current, state })
    );
    syncSpritesToStage({ app: appRef.current, sprites: spritesRef.current, state: useCosmosStore.getState() });
    return unsub;
  }, []);

  // Star twinkle animation
  useEffect(() => {
    let frameId;
    const tick = () => {
      frameId = requestAnimationFrame(tick);
      const t = performance.now() * 0.001;
      for (const s of starsRef.current) {
        s.g.alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(t * s.speed * 60 + s.phase));
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Movement loop
  useEffect(() => {
    let frameId;
    const tick = () => {
      frameId = requestAnimationFrame(tick);
      const app = appRef.current;
      if (!app) return;
      const store = useCosmosStore.getState();
      if (!store.mySocketId) return;
      const keys = keysRef.current;
      let { x, y } = store.myPosition;
      let moved = false;
      if (keys.has('w') || keys.has('arrowup'))    { y = Math.max(AVATAR_RADIUS, y - MOVE_SPEED); moved = true; }
      if (keys.has('s') || keys.has('arrowdown'))  { y = Math.min(CANVAS_HEIGHT - AVATAR_RADIUS, y + MOVE_SPEED); moved = true; }
      if (keys.has('a') || keys.has('arrowleft'))  { x = Math.max(AVATAR_RADIUS, x - MOVE_SPEED); moved = true; }
      if (keys.has('d') || keys.has('arrowright')) { x = Math.min(CANVAS_WIDTH - AVATAR_RADIUS, x + MOVE_SPEED); moved = true; }
      if (moved) {
        store.setMyPosition({ x, y });
        const now = Date.now();
        if (now - lastEmitRef.current > POSITION_THROTTLE_MS) {
          lastEmitRef.current = now;
          getSocket().emit('position:update', { x, y });
        }
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);
};
