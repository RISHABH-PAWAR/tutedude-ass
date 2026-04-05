import { AnimatePresence } from 'framer-motion';
import { useSocket } from './hooks/useSocket.js';
import { useWebRTC } from './hooks/useWebRTC.js';
import useCosmosStore from './store/cosmosStore.js';
import NameEntry from './components/ui/NameEntry.jsx';
import AppShell from './components/layout/AppShell.jsx';

const App = () => {
  useSocket();
  const { toggleMic, toggleCamera } = useWebRTC();

  const hasJoined = useCosmosStore(s => s.hasJoined);

  return (
    <>
      <AppShell onToggleMic={toggleMic} onToggleCamera={toggleCamera} />
      <AnimatePresence>
        {!hasJoined && <NameEntry key="entry" />}
      </AnimatePresence>
    </>
  );
};

export default App;
