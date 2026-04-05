import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCosmosStore from '../../store/cosmosStore.js';
import ChatMessage from './ChatMessage.jsx';
import ChatInput from './ChatInput.jsx';
import { getAvatarColorHex } from '../../utils/avatarColor.js';

const ChatPanel = () => {
  const connections = useCosmosStore(s => s.connections);
  const activeRoomId = useCosmosStore(s => s.activeRoomId);
  const messages = useCosmosStore(s => s.messages);
  const setActiveRoomId = useCosmosStore(s => s.setActiveRoomId);
  const scrollRef = useRef(null);

  const activeConnection = connections.find(c => c.roomId === activeRoomId);
  const roomMessages = messages[activeRoomId] || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [roomMessages]);

  return (
    <AnimatePresence>
      {connections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 300,
            height: 420,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(8,8,8,0.96)',
            border: '1px solid rgba(0,232,122,0.18)',
            borderRadius: '16px',
            overflow: 'hidden',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(0,232,122,0.1)',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="dot-live" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#F8F8F8' }}>
                {activeConnection?.peerName || 'Nearby'}
              </span>
              {activeConnection && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: getAvatarColorHex(activeConnection.peerName),
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>

            {connections.length > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {connections.map(c => (
                  <button
                    key={c.roomId}
                    onClick={() => setActiveRoomId(c.roomId)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: 11,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: c.roomId === activeRoomId
                        ? 'rgba(0,232,122,0.2)'
                        : 'transparent',
                      color: c.roomId === activeRoomId ? '#00E87A' : '#555',
                      fontFamily: 'DM Sans, system-ui, sans-serif',
                    }}
                  >
                    {(c.peerName || 'Nearby').split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            ref={scrollRef}
            className="chat-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
            }}
          >
            {roomMessages.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>👋</div>
                <p style={{ fontSize: 12, color: '#444' }}>
                  You&apos;re close to {activeConnection?.peerName || 'someone'}
                </p>
                <p style={{ fontSize: 11, color: '#333', marginTop: 4 }}>
                  Say hello!
                </p>
              </div>
            ) : (
              roomMessages.map((msg, i) => (
                <ChatMessage key={`${msg.timestamp}-${i}`} message={msg} index={i} />
              ))
            )}
          </div>

          <ChatInput roomId={activeRoomId} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;
