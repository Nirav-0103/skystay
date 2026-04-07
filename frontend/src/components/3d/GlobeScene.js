import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// ─── Indian City Coordinates (lat, lng) → 3D sphere positions ───
const CITIES = [
  { name: 'Mumbai',    lat: 19.076,  lng: 72.877 },
  { name: 'Delhi',     lat: 28.613,  lng: 77.209 },
  { name: 'Goa',       lat: 15.299,  lng: 73.957 },
  { name: 'Bangalore', lat: 12.971,  lng: 77.594 },
  { name: 'Chennai',   lat: 13.082,  lng: 80.270 },
  { name: 'Kolkata',   lat: 22.572,  lng: 88.363 },
  { name: 'Jaipur',    lat: 26.912,  lng: 75.787 },
  { name: 'Udaipur',   lat: 24.585,  lng: 73.712 },
  { name: 'Hyderabad', lat: 17.385,  lng: 78.486 },
  { name: 'Pune',      lat: 18.520,  lng: 73.856 },
];

const ROUTES = [
  [0, 1], // Mumbai → Delhi
  [0, 2], // Mumbai → Goa
  [1, 3], // Delhi → Bangalore
  [1, 4], // Delhi → Chennai
  [3, 8], // Bangalore → Hyderabad
  [1, 6], // Delhi → Jaipur
  [0, 5], // Mumbai → Kolkata
  [1, 7], // Delhi → Udaipur
  [0, 9], // Mumbai → Pune
  [3, 4], // Bangalore → Chennai
];

// Convert lat/lng to 3D sphere position
function latLngToVec3(lat, lng, radius = 1.55) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Create curved arc between two 3D points
function createArc(start, end, segments = 48) {
  const points = [];
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const dist = start.distanceTo(end);
  mid.normalize().multiplyScalar(1.55 + dist * 0.25);
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3();
    // Quadratic bezier
    p.x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * mid.x + t * t * end.x;
    p.y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * mid.y + t * t * end.y;
    p.z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * mid.z + t * t * end.z;
    points.push(p);
  }
  return points;
}

// ─── Animated Globe ───
function Globe({ mousePos }) {
  const groupRef = useRef();
  const wireRef = useRef();
  const glowRef = useRef();
  
  // Slow auto rotation + mouse reactivity
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
      // Subtle mouse influence
      const targetX = mousePos.current.y * 0.15;
      const targetZ = -mousePos.current.x * 0.1;
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.02;
      groupRef.current.rotation.z += (targetZ - groupRef.current.rotation.z) * 0.02;
    }
    // Pulse glow
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.06 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  const cityPositions = useMemo(() => 
    CITIES.map(c => latLngToVec3(c.lat, c.lng)), []);
  
  const routeGeometries = useMemo(() => 
    ROUTES.map(([a, b]) => {
      const pts = createArc(cityPositions[a], cityPositions[b]);
      return new THREE.BufferGeometry().setFromPoints(pts);
    }), [cityPositions]);

  return (
    <group ref={groupRef} rotation={[0.3, -1.2, 0]}>
      {/* Main wireframe sphere */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.5, 36, 36]} />
        <meshBasicMaterial 
          color="#1a6ef5" 
          wireframe 
          transparent 
          opacity={0.08}
        />
      </mesh>
      
      {/* Inner glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.48, 32, 32]} />
        <meshBasicMaterial 
          color="#1a6ef5" 
          transparent 
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere */}
      <mesh>
        <sphereGeometry args={[1.65, 32, 32]} />
        <meshBasicMaterial 
          color="#3b82f6" 
          transparent 
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>

      {/* City dots */}
      {cityPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Core dot */}
          <mesh>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
          {/* Glow ring */}
          <mesh>
            <ringGeometry args={[0.03, 0.05, 16]} />
            <meshBasicMaterial 
              color="#fbbf24" 
              transparent 
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {/* Flight route arcs */}
      {routeGeometries.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial 
            color="#60a5fa" 
            transparent 
            opacity={0.3}
            linewidth={1}
          />
        </line>
      ))}

      {/* Equator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.003, 8, 64]} />
        <meshBasicMaterial color="#1a6ef5" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// ─── Floating Particles ───
function Particles() {
  const particlesRef = useRef();
  const count = 80;
  
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#93c5fd" 
        size={0.015} 
        transparent 
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Main Export ───
export default function GlobeScene() {
  const mousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef();

  useEffect(() => {
    const handleMouse = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mousePos.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mousePos.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.85,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.5} />
        <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.3}>
          <Globe mousePos={mousePos} />
        </Float>
        <Particles />
      </Canvas>
    </div>
  );
}
