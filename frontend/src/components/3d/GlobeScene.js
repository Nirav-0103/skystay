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
  [0, 1], [0, 2], [1, 3], [1, 4], [3, 8],
  [1, 6], [0, 5], [1, 7], [0, 9], [3, 4],
];

function latLngToVec3(lat, lng, radius = 2.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createArc(start, end, segments = 48) {
  const points = [];
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const dist = start.distanceTo(end);
  mid.normalize().multiplyScalar(2.0 + dist * 0.3);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3();
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
  const glowRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
      const targetX = mousePos.current.y * 0.2;
      const targetZ = -mousePos.current.x * 0.15;
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.03;
      groupRef.current.rotation.z += (targetZ - groupRef.current.rotation.z) * 0.03;
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  const cityPositions = useMemo(() => CITIES.map(c => latLngToVec3(c.lat, c.lng)), []);
  
  const routeGeometries = useMemo(() => 
    ROUTES.map(([a, b]) => {
      const pts = createArc(cityPositions[a], cityPositions[b]);
      return new THREE.BufferGeometry().setFromPoints(pts);
    }), [cityPositions]);

  return (
    <group ref={groupRef} rotation={[0.3, -1.2, 0]}>
      {/* Main wireframe sphere - BOLD */}
      <mesh>
        <sphereGeometry args={[1.95, 40, 40]} />
        <meshBasicMaterial color="#1a6ef5" wireframe transparent opacity={0.18} />
      </mesh>
      
      {/* Inner glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.92, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>

      {/* Outer atmosphere glow - BIG & visible */}
      <mesh>
        <sphereGeometry args={[2.15, 32, 32]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>

      {/* City dots - BIGGER & BRIGHTER */}
      {cityPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
          {/* Outer glow */}
          <mesh>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.25} />
          </mesh>
        </group>
      ))}

      {/* Flight route arcs - BRIGHTER */}
      {routeGeometries.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial color="#60a5fa" transparent opacity={0.5} />
        </line>
      ))}

      {/* Latitude rings */}
      {[0, 0.4, -0.4].map((tilt, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + tilt, 0, 0]}>
          <torusGeometry args={[2.0, 0.004, 8, 80]} />
          <meshBasicMaterial color="#1a6ef5" transparent opacity={0.12} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Floating Particles ───
function Particles() {
  const particlesRef = useRef();
  const count = 120;
  
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 8;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.015) * 0.15;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#93c5fd" size={0.025} transparent opacity={0.6} sizeAttenuation />
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
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.8} />
        <Float speed={0.6} rotationIntensity={0.15} floatIntensity={0.4}>
          <Globe mousePos={mousePos} />
        </Float>
        <Particles />
      </Canvas>
    </div>
  );
}
