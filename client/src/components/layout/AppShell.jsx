import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCosmosStore from '../../store/cosmosStore.js';
import CosmosCanvas from '../cosmos/CosmosCanvas.jsx';
import ChatPanel from '../chat/ChatPanel.jsx';
import ConnectionBadge from '../ui/ConnectionBadge.jsx';
import UserCount from '../ui/UserCount.jsx';
import { getAvatarColorHex } from '../../utils/avatarColor.js';

const TICKER_ITEMS = [
  'WASD to move',
  'Approach others to chat',
  'Walk away to close',
  'Real-time proximity',
  'End-to-end multiplayer',
  'Live positions',
];

const AppShell = () => {
  const myUsername = useCosmosStore(s => s.myUsername);
  const hasJoined = useCosmosStore(s => s.hasJoined);
  const [showControls, setShowControls] = useState(false);

  const avatarColor = myUsername ? getAvatarColorHex(myUsername) : 'transparent';
  const initial = myUsername ? myUsername.charAt(0).toUpperCase() : '';

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#050505',
      }}
    >
      <header
        className="floating-nav"
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 56,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🌌</span>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#F8F8F8',
          }}>
            Virtual Cosmos
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ConnectionBadge />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <UserCount />

          <button
            onClick={() => setShowControls(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: showControls ? 'rgba(0,232,122,0.08)' : 'transparent',
              color: showControls ? '#00E87A' : '#555',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            Controls
          </button>

          {hasJoined && myUsername && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#050505',
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#888', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {myUsername}
              </span>
            </div>
          )}
        </div>
      </header>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 64,
              right: 20,
              zIndex: 20,
              background: 'rgba(10,10,10,0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '16px 18px',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              minWidth: 200,
            }}
          >
            <p style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#00E87A',
              marginBottom: 12,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              Controls
            </p>
            {[
              { keys: ['W', 'A', 'S', 'D'], label: 'Move avatar' },
              { keys: ['↑', '↓', '←', '→'], label: 'Move (arrows)' },
              { keys: ['Enter'], label: 'Send message' },
            ].map(({ keys, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {keys.map(k => (
                    <kbd key={k} style={{
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono, monospace',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 4,
                      padding: '2px 6px',
                      color: '#888',
                    }}>
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <CosmosCanvas />

        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            zIndex: 10,
          }}
        >
          <ChatPanel />
        </div>
      </main>

      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          position: 'relative',
          overflow: 'hidden',
          height: 36,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 60,
            background: 'linear-gradient(to right, #050505, transparent)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 60,
            background: 'linear-gradient(to left, #050505, transparent)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        <div style={{ display: 'flex', animation: 'marquee 30s linear infinite', whiteSpace: 'nowrap' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="ticker-item">
              {item}
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#222', display: 'inline-block', flexShrink: 0 }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
