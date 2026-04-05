import useCosmosStore from '../../store/cosmosStore.js';

const Btn = ({ onClick, active, danger, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, borderRadius: '50%', border: 'none',
      cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
      background: danger
        ? 'rgba(239,68,68,0.18)'
        : active
          ? 'rgba(0,232,122,0.15)'
          : 'rgba(255,255,255,0.06)',
      color: danger ? '#ef4444' : active ? '#00E87A' : '#666',
      outline: 'none',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
  >
    {children}
  </button>
);

const MicIcon = ({ on }) => on ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/>
    <path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 18 0h-2z"/>
    <line x1="12" y1="20" x2="12" y2="24" stroke="currentColor" strokeWidth="2"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
    <path d="M15 9.34V5a3 3 0 0 0-5.94-.6"/>
    <path d="M17 16.95A7 7 0 0 1 5 11v-1M19 11a7 7 0 0 1-.11 1.23"/>
    <line x1="12" y1="20" x2="12" y2="24"/>
  </svg>
);

const CamIcon = ({ on }) => on ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23 7l-7 5 7 5V7z"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/>
    <path d="M23 7l-7 5 7 5V7z"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const MediaControls = ({ onToggleMic, onToggleCamera }) => {
  const isMicOn = useCosmosStore(s => s.isMicOn);
  const isCameraOn = useCosmosStore(s => s.isCameraOn);
  const hasJoined = useCosmosStore(s => s.hasJoined);

  if (!hasJoined) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Btn onClick={onToggleMic} active={isMicOn} danger={!isMicOn} title={isMicOn ? 'Mute mic' : 'Unmute mic'}>
        <MicIcon on={isMicOn} />
      </Btn>
      <Btn onClick={onToggleCamera} active={isCameraOn} title={isCameraOn ? 'Stop camera' : 'Start camera'}>
        <CamIcon on={isCameraOn} />
      </Btn>
    </div>
  );
};

export default MediaControls;
