import useCosmosStore from '../../store/cosmosStore.js';

const UserCount = () => {
  const count = useCosmosStore(s => s.users.length);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: '#555',
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 500,
      }}
    >
      <div className="dot-live" style={{ width: 5, height: 5 }} />
      <span>{count} online</span>
    </div>
  );
};

export default UserCount;
