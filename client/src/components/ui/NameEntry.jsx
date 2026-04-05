import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSocket } from '../../socket/socketClient.js';
import useCosmosStore from '../../store/cosmosStore.js';

const ease = [0.16, 1, 0.3, 1];

const HINTS = [
  'Move with WASD or arrow keys',
  'Get close to someone to chat',
  'Chat closes when you move away',
];

const NameEntry = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setMyUsername = useCosmosStore(s => s.setMyUsername);
  const setIsConnecting = useCosmosStore(s => s.setIsConnecting);

  const canJoin = name.trim().length >= 2 && !loading;

  const handleJoin = () => {
    const trimmed = name.trim();
    if (!canJoin) return;
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setError('');
    setLoading(true);
    setMyUsername(trimmed);
    setIsConnecting(true);

    const socket = connectSocket();

    const doJoin = () => {
      socket.emit('user:join', { username: trimmed });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
      }}
    >
      <div
        className="bg-grid"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '15%',
          width: 600,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,232,122,0.07) 0%, transparent 65%)',
          filter: 'blur(40px)',
          animation: 'float-slow 14s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'float-slow-2 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15%',
          right: '20%',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,107,0,0.05) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'float-slow-3 20s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,232,122,0.1) 0%, transparent 70%)',
          filter: 'blur(20px)',
          animation: 'orb-pulse 7s ease-in-out infinite',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          margin: '0 20px',
          background: 'rgba(10,10,10,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '40px 36px',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(0,232,122,0.1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -1,
            borderRadius: 21,
            background: 'linear-gradient(135deg, rgba(0,232,122,0.08) 0%, transparent 50%, rgba(99,102,241,0.05) 100%)',
            pointerEvents: 'none',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <div style={{ marginBottom: 16 }}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
              style={{ fontSize: 44, display: 'inline-block' }}
            >
              🌌
            </motion.div>
          </div>

          <div className="section-tag" style={{ justifyContent: 'center', marginBottom: 12 }}>
            Multiplayer Space
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#F8F8F8',
            marginBottom: 8,
            lineHeight: 1.1,
          }}>
            Virtual{' '}
            <span className="text-shimmer">Cosmos</span>
          </h1>

          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
            Move close to others to unlock proximity chat. Walk away to close it.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.6, ease }}
          style={{ marginBottom: 20 }}
        >
          <label style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#00E87A',
            marginBottom: 8,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Enter your name..."
            maxLength={32}
            autoFocus
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 15,
              color: '#F8F8F8',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              fontFamily: 'DM Sans, system-ui, sans-serif',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(0,232,122,0.4)';
              e.target.style.boxShadow = '0 0 0 3px rgba(0,232,122,0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                style={{ fontSize: 12, color: 'rgba(239,68,68,0.8)', marginTop: 6, paddingLeft: 2 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.6, ease }}
        >
          <button
            onClick={handleJoin}
            disabled={!canJoin}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span>{loading ? 'Connecting...' : 'Enter the Cosmos'}</span>
            <span className="arr">
              {loading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
                  <path d="M21 12a9 9 0 00-9-9" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#333',
            marginBottom: 10,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            How it works
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {HINTS.map((hint, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  color: '#00E87A',
                  fontWeight: 600,
                  flexShrink: 0,
                  width: 16,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 12, color: '#555' }}>{hint}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  );
};

export default NameEntry;
