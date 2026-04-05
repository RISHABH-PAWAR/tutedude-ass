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

const syncSpritesToStage = ({ app, sprites, state }) => {
  if (!app?.stage) return;

  const { mySocketId, myPosition, users, connections } = state;
  const connectedIds = new Set(connections.map(c => c.peerId));

  for (const [id, sprite] of sprites.entries()) {
    if (!users.find(u => u.socketId === id)) {
      sprite.destroy();
      sprites.delete(id);
    }
  }

  for (const user of users) {
    const isSelf = user.socketId === mySocketId;
    const pos = isSelf ? myPosition : user;

    if (!sprites.has(user.socketId)) {
      const sprite = new AvatarSprite({
        username: user.username,
        socketId: user.socketId,
        isSelf,
      });
      app.stage.addChild(sprite.container);
      sprites.set(user.socketId, sprite);
    }

    const sprite = sprites.get(user.socketId);
    if (sprite) {
      sprite.update(pos.x, pos.y, connectedIds.has(user.socketId));
    }
  }
};

export const useCosmosScene = (canvasRef) => {
  const appRef = useRef(null);
  const spritesRef = useRef(new Map());
  const lastEmitRef = useRef(0);
  const keysRef = useKeyboard();

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
          background: 0x050505,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (destroyed) {
          app.destroy({ removeView: false, children: true });
          return;
        }

        appRef.current = app;
        _drawBackground(app);
        syncSpritesToStage({
          app,
          sprites: spritesRef.current,
          state: useCosmosStore.getState(),
        });
      } catch {
        if (!destroyed) {
          appRef.current = null;
        }
      }
    })();

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy({ removeView: false, children: true });
        appRef.current = null;
      }
      spritesRef.current.clear();
    };
  }, []);

  // Sprite sync — Zustand subscribe, runs once, handles all state changes
  useEffect(() => {
    const syncSprites = (state) => {
      syncSpritesToStage({
        app: appRef.current,
        sprites: spritesRef.current,
        state,
      });
    };

    const unsub = useCosmosStore.subscribe(syncSprites);
    syncSprites(useCosmosStore.getState());
    return unsub;
  }, []);

  // Movement loop — guard is INSIDE tick so the loop always starts at mount
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

      if (keys.has('w') || keys.has('arrowup')) {
        y = Math.max(AVATAR_RADIUS, y - MOVE_SPEED);
        moved = true;
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        y = Math.min(CANVAS_HEIGHT - AVATAR_RADIUS, y + MOVE_SPEED);
        moved = true;
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        x = Math.max(AVATAR_RADIUS, x - MOVE_SPEED);
        moved = true;
      }
      if (keys.has('d') || keys.has('arrowright')) {
        x = Math.min(CANVAS_WIDTH - AVATAR_RADIUS, x + MOVE_SPEED);
        moved = true;
      }

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

const _drawBackground = (app) => {
  const bg = new Graphics();

  bg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    .fill({ color: 0x050505 });

  const gridSize = 52;
  const cols = Math.ceil(CANVAS_WIDTH / gridSize);
  const rows = Math.ceil(CANVAS_HEIGHT / gridSize);

  for (let i = 0; i <= cols; i++) {
    bg.moveTo(i * gridSize, 0).lineTo(i * gridSize, CANVAS_HEIGHT);
  }
  for (let j = 0; j <= rows; j++) {
    bg.moveTo(0, j * gridSize).lineTo(CANVAS_WIDTH, j * gridSize);
  }
  bg.stroke({ color: 0xffffff, width: 0.5, alpha: 0.025 });

  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  for (let r = 150; r <= 600; r += 150) {
    bg.circle(centerX, centerY, r)
      .stroke({ color: 0x00E87A, width: 0.5, alpha: 0.03 });
  }

  app.stage.addChild(bg);
};
