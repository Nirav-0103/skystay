import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 3D Math to generate random points on a sphere
function randomInSphere(numPoints, radius) {
  const positions = new Float32Array(numPoints * 3);
  for (let i = 0; i < numPoints; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    // Add some noise for a "cloud" look instead of a perfect shell
    const noise = (Math.random() - 0.5) * 0.5;
    
    positions[i * 3] = x + noise;
    positions[i * 3 + 1] = y + noise;
    positions[i * 3 + 2] = z + noise;
  }
  return positions;
}

function ParticleGlobe() {
  const ref = useRef();
  const { mouse, viewport } = useThree();
  
  // Create 6000 particles at a radius of 1.5
  const sphere = useMemo(() => randomInSphere(6000, 1.5), []);
  
  useFrame((state, delta) => {
    if (!ref.current) return;
    // Slow continuous rotation
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
    
    // Antigravity Mouse Parallax Effect (smooth lerping)
    const targetX = (mouse.x * viewport.width) / 10;
    const targetY = (mouse.y * viewport.height) / 10;
    
    ref.current.position.x += (targetX - ref.current.position.x) * 0.05;
    ref.current.position.y += (targetY - ref.current.position.y) * 0.05;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#1a6ef5"
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export default function Hero3D() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      {/* 
        We use pointerEvents: 'none' on the wrapper so the canvas doesn't block UI clicks (buttons, inputs)
        However, Fiber's events might not trigger if wrapper ignores pointers.
        BUT we only need mouse movement on the document, which Fiber intercepts properly from window if set up, 
        but Canvas usually listens on its DOM element. To fix this, we allow pointer events but place it under the UI.
      */}
      <Canvas 
        camera={{ position: [0, 0, 3] }}
        style={{ pointerEvents: 'none' }} // Canvas itself ignores clicks
      >
        <ambientLight intensity={0.5} />
        <ParticleGlobe />
      </Canvas>
      <style jsx>{`
        div {
          mask-image: radial-gradient(circle at center, black 0%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at center, black 0%, transparent 80%);
        }
      `}</style>
    </div>
  );
}
