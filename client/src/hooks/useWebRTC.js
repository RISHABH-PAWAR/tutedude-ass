import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../socket/socketClient.js';
import useCosmosStore from '../store/cosmosStore.js';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const useWebRTC = () => {
  const pcsRef = useRef(new Map());    // roomId → RTCPeerConnection
  const localStreamRef = useRef(null);

  const { setLocalStream, addRemoteStream, removeRemoteStream, setIsMicOn, setIsCameraOn } = useCosmosStore();

  /* ── Acquire local media ─────────────────── */
  const getLocalStream = useCallback(async (withVideo = false) => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch {
      console.warn('🎙️ Media permission denied — text-only mode');
      return null;
    }
  }, []);

  /* ── Build a peer connection ─────────────── */
  const buildPC = useCallback((roomId, peerId) => {
    if (pcsRef.current.has(roomId)) return pcsRef.current.get(roomId);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcsRef.current.set(roomId, pc);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) getSocket().emit('webrtc:ice-candidate', { targetId: peerId, candidate, roomId });
    };
    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== 'stable') return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        getSocket().emit('webrtc:offer', { targetId: peerId, offer, roomId });
      } catch (e) { console.error('Negotiation failed:', e); }
    };
    pc.ontrack = ({ streams }) => {
      if (streams[0]) {
        // Create new MediaStream to force React state update (Zustand strictly compares references)
        addRemoteStream(peerId, new MediaStream(streams[0].getTracks()));
      }
    };
    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        closePC(roomId, peerId);
      }
    };
    return pc;
  }, []);

  const closePC = useCallback((roomId, peerId) => {
    const pc = pcsRef.current.get(roomId);
    if (pc) { pc.close(); pcsRef.current.delete(roomId); }
    if (peerId) removeRemoteStream(peerId);
  }, []);

  /* ── Signaling ───────────────────────────── */
  const initiateCall = useCallback(async (roomId, peerId) => {
    const stream = await getLocalStream();
    const pc = buildPC(roomId, peerId);
    if (stream) {
      const senders = pc.getSenders();
      stream.getTracks().forEach(t => {
        if (!senders.some(s => s.track === t)) pc.addTrack(t, stream);
      });
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    getSocket().emit('webrtc:offer', { targetId: peerId, offer, roomId });
  }, []);

  const handleOffer = useCallback(async ({ fromId, offer, roomId }) => {
    const stream = await getLocalStream();
    const pc = buildPC(roomId, fromId);
    if (stream) {
      const senders = pc.getSenders();
      stream.getTracks().forEach(t => {
        if (!senders.some(s => s.track === t)) pc.addTrack(t, stream);
      });
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    getSocket().emit('webrtc:answer', { targetId: fromId, answer, roomId });
  }, []);

  const handleAnswer = useCallback(async ({ fromId, answer, roomId }) => {
    const pc = pcsRef.current.get(roomId);
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  const handleIce = useCallback(async ({ candidate, roomId }) => {
    const pc = pcsRef.current.get(roomId);
    try { if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
  }, []);

  /* ── Mic / Camera toggles ────────────────── */
  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !stream.getAudioTracks()[0]?.enabled;
    stream.getAudioTracks().forEach(t => { t.enabled = enabled; });
    setIsMicOn(enabled);
  }, []);

  const toggleCamera = useCallback(async () => {
    const store = useCosmosStore.getState();
    if (!store.isCameraOn) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const vTrack = newStream.getVideoTracks()[0];
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(vTrack);
          for (const [, pc] of pcsRef.current) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) await sender.replaceTrack(vTrack);
            else pc.addTrack(vTrack, localStreamRef.current);
          }
        } else {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          localStreamRef.current = s;
          setLocalStream(s);
          for (const [, pc] of pcsRef.current) {
            s.getTracks().forEach(t => pc.addTrack(t, s));
          }
        }
        setIsCameraOn(true);
        // Force React update for local preview
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      } catch { console.warn('Camera denied'); }
    } else {
      localStreamRef.current?.getVideoTracks().forEach(t => { t.stop(); localStreamRef.current.removeTrack(t); });
      setIsCameraOn(false);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    }
  }, []);

  /* ── Socket listeners ────────────────────── */
  useEffect(() => {
    const socket = getSocket();

    const onProximityConnect = async ({ roomId, peerId }) => {
      const myId = useCosmosStore.getState().mySocketId;
      // Lower ID initiates (deterministic)
      if (myId < peerId) await initiateCall(roomId, peerId);
    };
    const onProximityDisconnect = ({ roomId }) => {
      const conn = useCosmosStore.getState().connections.find(c => c.roomId === roomId);
      closePC(roomId, conn?.peerId);
    };

    socket.on('proximity:connect', onProximityConnect);
    socket.on('proximity:disconnect', onProximityDisconnect);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIce);

    return () => {
      socket.off('proximity:connect', onProximityConnect);
      socket.off('proximity:disconnect', onProximityDisconnect);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIce);
    };
  }, []);

  /* ── Cleanup on unmount ──────────────────── */
  useEffect(() => {
    return () => {
      for (const [, pc] of pcsRef.current) pc.close();
      pcsRef.current.clear();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  return { toggleMic, toggleCamera };
};
