import { motion } from 'framer-motion';
import useCosmosStore from '../../store/cosmosStore.js';

const ChatMessage = ({ message, index }) => {
  const mySocketId = useCosmosStore(s => s.mySocketId);
  const isMine = message.senderId === mySocketId;

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.03, 0.12) }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`max-w-[82%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1"
            style={{ color: '#00E87A', fontFamily: 'JetBrains Mono, monospace' }}>
            {message.senderName}
          </span>
        )}
        <div
          className="px-3 py-2 text-sm leading-relaxed"
          style={{
            background: isMine ? 'rgba(255,107,0,0.18)' : 'rgba(255,255,255,0.06)',
            border: isMine
              ? '1px solid rgba(255,107,0,0.3)'
              : '1px solid rgba(255,255,255,0.08)',
            borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            color: isMine ? '#F8F8F8' : '#cccccc',
            wordBreak: 'break-word',
          }}
        >
          {message.text}
        </div>
        <span className="text-[10px] px-1" style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>
          {time}
        </span>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
