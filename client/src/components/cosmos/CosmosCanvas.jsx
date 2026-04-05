import { useRef } from 'react';
import { useCosmosScene } from './useCosmosScene.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants/config.js';

const CosmosCanvas = () => {
  const canvasRef = useRef(null);
  useCosmosScene(canvasRef);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        background: 'transparent',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    />
  );
};

export default CosmosCanvas;
