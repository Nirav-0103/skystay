import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

// Convert lat/lon to 3D sphere coordinates
function latLonToVec3(lat, lon, radius = 1.5) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Booking dot on globe
function BookingDot({ lat, lon, count = 1 }) {
  const meshRef = useRef();
  const size = Math.min(0.02 + count * 0.008, 0.08);
  const pos = latLonToVec3(lat, lon);
  const color = count > 10 ? '#ff6b6b' : count > 5 ? '#fbbf24' : '#1a6ef5';

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2 + lat) * 0.3);
    }
  });

  return (
    <mesh ref={meshRef} position={[pos.x, pos.y, pos.z]}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
  );
}

// Wireframe Globe
function GlobeMesh() {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  // Indian cities with approximate booking dots
  const cities = [
    { lat: 28.6, lon: 77.2, count: 15 },   // Delhi
    { lat: 19.0, lon: 72.8, count: 18 },   // Mumbai
    { lat: 12.9, lon: 77.5, count: 12 },   // Bangalore
    { lat: 22.5, lon: 88.3, count: 9 },    // Kolkata
    { lat: 17.3, lon: 78.4, count: 7 },    // Hyderabad
    { lat: 13.0, lon: 80.2, count: 8 },    // Chennai
    { lat: 26.9, lon: 75.7, count: 6 },    // Jaipur
    { lat: 23.0, lon: 72.5, count: 11 },   // Ahmedabad
    { lat: 18.5, lon: 73.8, count: 5 },    // Pune
    { lat: 21.1, lon: 79.0, count: 4 },    // Nagpur
    // International
    { lat: 51.5, lon: -0.1, count: 3 },    // London
    { lat: 40.7, lon: -74.0, count: 2 },   // New York
    { lat: 25.2, lon: 55.2, count: 6 },    // Dubai
    { lat: 1.3, lon: 103.8, count: 4 },    // Singapore
    { lat: 35.6, lon: 139.6, count: 2 },   // Tokyo
  ];

  return (
    <group ref={meshRef}>
      {/* Main sphere */}
      <mesh>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshStandardMaterial
          color="#0a2040"
          roughness={0.8}
          metalness={0.1}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[1.52, 24, 24]} />
        <meshBasicMaterial
          color="#1a6ef5"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.015, 8, 64]} />
        <meshBasicMaterial color="#1a6ef5" transparent opacity={0.5} />
      </mesh>

      {/* Booking dots */}
      {cities.map((city, i) => (
        <BookingDot key={i} {...city} />
      ))}
    </group>
  );
}

// Atmosphere glow effect
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.65, 32, 32]} />
      <meshBasicMaterial
        color="#1a6ef5"
        transparent
        opacity={0.04}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

export default function Globe3D() {
  return (
    <div style={{
      width: '100%',
      height: 320,
      borderRadius: 16,
      overflow: 'hidden',
      background: 'radial-gradient(ellipse at center, #0d1f3c 0%, #050d1a 100%)'
    }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#1a6ef5" />
        <GlobeMesh />
        <Atmosphere />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.15}
        />
      </Canvas>
    </div>
  );
}
