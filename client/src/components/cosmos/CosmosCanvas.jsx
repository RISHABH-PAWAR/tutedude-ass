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
        maxWidth: '100%',
        maxHeight: '100%',
        background: '#050505',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    />
  );
};

export default CosmosCanvas;
