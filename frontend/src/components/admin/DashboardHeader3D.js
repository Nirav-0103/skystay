import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FloatingSphere({ position, color, speed = 1, distort = 0.3, size = 0.5 }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.elapsedTime * speed * 0.3;
      meshRef.current.rotation.y = clock.elapsedTime * speed * 0.2;
    }
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.5} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  );
}

function FloatingRing({ position, color, speed = 0.5 }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.elapsedTime * speed;
      meshRef.current.rotation.z = clock.elapsedTime * speed * 0.7;
    }
  });

  return (
    <Float speed={speed} floatIntensity={1}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[0.4, 0.08, 12, 40]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.9} />
      </mesh>
    </Float>
  );
}

export default function DashboardHeader3D({ stats }) {
  const totalRevenue = stats?.totalRevenue || 0;
  const totalBookings = stats?.totalBookings || 0;

  return (
    <div style={{
      width: '100%',
      height: 160,
      borderRadius: 20,
      overflow: 'hidden',
      position: 'relative',
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2247 50%, #0a1628 100%)',
    }}>
      {/* Text overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        pointerEvents: 'none'
      }}>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', color: '#1a6ef5', textTransform: 'uppercase', marginBottom: 4 }}>
            ✦ SkyStay Admin Portal
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', lineHeight: 1.1 }}>
            Welcome back,<br />
            <span style={{ background: 'linear-gradient(90deg, #1a6ef5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Admin ✦
            </span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 20 }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              Revenue <span style={{ color: '#10b981', fontWeight: 700 }}>₹{(totalRevenue / 1000).toFixed(0)}k</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              Bookings <span style={{ color: '#fbbf24', fontWeight: 700 }}>{totalBookings}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 3, 3]} intensity={2} color="#1a6ef5" />
        <pointLight position={[-3, -3, 3]} intensity={1} color="#7c3aed" />

        <FloatingSphere position={[2, 0, 0]} color="#1a6ef5" speed={0.8} distort={0.4} size={0.7} />
        <FloatingSphere position={[-1, 0.5, -1]} color="#7c3aed" speed={1.2} distort={0.3} size={0.4} />
        <FloatingSphere position={[0, -0.5, 0]} color="#10b981" speed={0.6} distort={0.5} size={0.25} />
        <FloatingRing position={[1, 0.8, 0]} color="#fbbf24" speed={0.4} />
        <FloatingRing position={[-0.5, -0.5, 0.5]} color="#1a6ef5" speed={0.6} />
      </Canvas>
    </div>
  );
}
