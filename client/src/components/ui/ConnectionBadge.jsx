import { AnimatePresence, motion } from 'framer-motion';
import useCosmosStore from '../../store/cosmosStore.js';
import { getAvatarColorHex } from '../../utils/avatarColor.js';

const ConnectionBadge = () => {
  const connections = useCosmosStore(s => s.connections);

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <AnimatePresence>
        {connections.map(({ roomId, peerName }) => (
          <motion.div
            key={roomId}
            initial={{ opacity: 0, scale: 0.8, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px 4px 7px',
              borderRadius: '9999px',
              background: 'rgba(0,232,122,0.08)',
              border: '1px solid rgba(0,232,122,0.2)',
              fontSize: 11,
              fontWeight: 600,
              color: '#00E87A',
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: getAvatarColorHex(peerName),
                animation: 'pulse-dot 2s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            {peerName}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ConnectionBadge;
