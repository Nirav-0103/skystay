import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

// Single 3D Bar
function Bar3D({ x, height, color, label, value }) {
  const meshRef = useRef();
  const targetHeight = Math.max(height, 0.05);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = meshRef.current.scale.y;
      meshRef.current.scale.y = THREE.MathUtils.lerp(scale, targetHeight, 0.05);
      meshRef.current.position.y = meshRef.current.scale.y / 2;
    }
  });

  return (
    <group position={[x, 0, 0]}>
      <mesh ref={meshRef} scale={[0.6, 0.01, 0.6]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
      </mesh>
      <Text
        position={[0, targetHeight + 0.3, 0]}
        fontSize={0.22}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {value}
      </Text>
      <Text
        position={[0, -0.4, 0]}
        fontSize={0.18}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, 0]}
      >
        {label}
      </Text>
    </group>
  );
}

// Floor grid
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 8]} />
      <meshStandardMaterial color="#0f1729" roughness={1} />
    </mesh>
  );
}

// Grid lines
function GridLines() {
  const points = [];
  for (let i = -4; i <= 4; i++) {
    points.push(new THREE.Vector3(i * 1.5, 0.01, -3));
    points.push(new THREE.Vector3(i * 1.5, 0.01, 3));
  }
  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <lineSegments geometry={lineGeo}>
      <lineBasicMaterial color="#1e3a5f" transparent opacity={0.5} />
    </lineSegments>
  );
}

export default function Chart3D({ data = [] }) {
  if (!data || data.length === 0) return null;

  const maxRevenue = Math.max(...data.map(d => d.revenue || 0), 1);
  const colors = ['#1a6ef5', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  const bars = data.slice(-6).map((d, i) => ({
    x: (i - (Math.min(data.slice(-6).length, 6) - 1) / 2) * 1.5,
    height: ((d.revenue || 0) / maxRevenue) * 3,
    color: colors[i % colors.length],
    label: d.month?.slice(0, 3) || `M${i + 1}`,
    value: d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(0)}k` : String(d.revenue || 0)
  }));

  return (
    <div style={{ width: '100%', height: 260, borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg, #0a1628 0%, #0f2347 100%)' }}>
      <Canvas
        camera={{ position: [0, 4, 7], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.6} color="#1a6ef5" />
        <Floor />
        <GridLines />
        {bars.map((bar, i) => (
          <Bar3D key={i} {...bar} />
        ))}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
