import { useState, useRef } from 'react';
import { getSocket } from '../../socket/socketClient.js';

const ChatInput = ({ roomId }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !roomId) return;
    getSocket().emit('chat:message', { roomId, text: trimmed });
    setText('');
    inputRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      className="flex gap-2 p-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder="Say something..."
        maxLength={500}
        autoComplete="off"
        style={{
          flex: 1,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '13px',
          color: '#F8F8F8',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          fontFamily: 'DM Sans, system-ui, sans-serif',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(0,232,122,0.35)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
      />
      <button
        onClick={send}
        disabled={!text.trim()}
        style={{
          background: text.trim() ? '#00E87A' : 'rgba(255,255,255,0.06)',
          border: 'none',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: text.trim() ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        aria-label="Send message"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#050505' : '#555'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default ChatInput;
