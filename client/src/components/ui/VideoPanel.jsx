import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCosmosStore from '../../store/cosmosStore.js';
import { getAvatarColorHex } from '../../utils/avatarColor.js';

const VideoTile = ({ stream, label, isLocal, color }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{
      position: 'relative',
      borderRadius: isLocal ? 8 : 12,
      overflow: 'hidden',
      background: '#0a0a0a',
      border: `1px solid ${color || 'rgba(0,232,122,0.2)'}44`,
      flexShrink: 0,
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* No-video overlay */}
      {(!stream || !stream.getVideoTracks().some(t => t.enabled)) && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,5,5,0.9)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: color || '#00E87A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#050505',
          }}>
            {(label || '?').charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      {label && (
        <div style={{
          position: 'absolute', bottom: 6, left: 8,
          fontSize: 10, fontWeight: 600, color: '#ccc',
          fontFamily: 'JetBrains Mono, monospace',
          textShadow: '0 1px 4px #000',
        }}>
          {label}{isLocal ? ' (you)' : ''}
        </div>
      )}
    </div>
  );
};

const VideoPanel = () => {
  const connections = useCosmosStore(s => s.connections);
  const remoteStreams = useCosmosStore(s => s.remoteStreams);
  const localStream = useCosmosStore(s => s.localStream);
  const myUsername = useCosmosStore(s => s.myUsername);

  const hasAny = connections.length > 0;

  return (
    <AnimatePresence>
      {hasAny && (
        <motion.div
          initial={{ opacity: 0, x: 24, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: 180,
          }}
        >
          {/* Remote streams */}
          {connections.map(conn => (
            <VideoTile
              key={conn.roomId}
              stream={remoteStreams[conn.peerId] || null}
              label={conn.peerName}
              isLocal={false}
              color={getAvatarColorHex(conn.peerName)}
            />
          ))}

          {/* Local preview */}
          {localStream && (
            <VideoTile
              stream={localStream}
              label={myUsername}
              isLocal={true}
              color="#00E87A"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPanel;
