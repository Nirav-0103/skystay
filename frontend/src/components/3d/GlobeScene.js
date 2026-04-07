import { useRef, useMemo, useEffect, useState } from 'react';

// We use vanilla Three.js instead of React Three Fiber for maximum compatibility
let THREE;
if (typeof window !== 'undefined') {
  THREE = require('three');
}

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

function latLngToVec3(lat, lng, radius) {
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
    points.push(new THREE.Vector3(
      (1-t)*(1-t)*start.x + 2*(1-t)*t*mid.x + t*t*end.x,
      (1-t)*(1-t)*start.y + 2*(1-t)*t*mid.y + t*t*end.y,
      (1-t)*(1-t)*start.z + 2*(1-t)*t*mid.z + t*t*end.z
    ));
  }
  return points;
}

export default function GlobeScene() {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !THREE) return;

    let animationId;
    const container = containerRef.current;

    try {
      // Scene
      const scene = new THREE.Scene();
      
      // Camera
      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.z = 4.5;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // Globe group
      const globe = new THREE.Group();
      globe.rotation.set(0.3, -1.2, 0);
      scene.add(globe);

      // Wireframe sphere
      const sphereGeo = new THREE.SphereGeometry(1.95, 40, 40);
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x1a6ef5, wireframe: true, transparent: true, opacity: 0.2 });
      globe.add(new THREE.Mesh(sphereGeo, wireMat));

      // Inner glow
      const glowGeo = new THREE.SphereGeometry(1.92, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.1, side: THREE.BackSide });
      globe.add(new THREE.Mesh(glowGeo, glowMat));

      // Outer atmosphere
      const atmoGeo = new THREE.SphereGeometry(2.2, 32, 32);
      const atmoMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.05, side: THREE.BackSide });
      globe.add(new THREE.Mesh(atmoGeo, atmoMat));

      // Latitude rings
      [0, 0.4, -0.4].forEach(tilt => {
        const torusGeo = new THREE.TorusGeometry(2.0, 0.005, 8, 80);
        const torusMat = new THREE.MeshBasicMaterial({ color: 0x1a6ef5, transparent: true, opacity: 0.15 });
        const ring = new THREE.Mesh(torusGeo, torusMat);
        ring.rotation.x = Math.PI / 2 + tilt;
        globe.add(ring);
      });

      // City dots
      const cityPositions = CITIES.map(c => latLngToVec3(c.lat, c.lng, 2.0));
      cityPositions.forEach(pos => {
        // Core bright dot
        const dotGeo = new THREE.SphereGeometry(0.045, 16, 16);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.copy(pos);
        globe.add(dot);
        // Glow
        const glowDotGeo = new THREE.SphereGeometry(0.09, 12, 12);
        const glowDotMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.2 });
        const glowDot = new THREE.Mesh(glowDotGeo, glowDotMat);
        glowDot.position.copy(pos);
        globe.add(glowDot);
      });

      // Flight route arcs
      ROUTES.forEach(([a, b]) => {
        const pts = createArc(cityPositions[a], cityPositions[b]);
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.5 });
        globe.add(new THREE.Line(geo, mat));
      });

      // Particles
      const particleCount = 150;
      const pGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3]     = (Math.random() - 0.5) * 8;
        pPositions[i * 3 + 1] = (Math.random() - 0.5) * 6;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const pMat = new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.03, transparent: true, opacity: 0.6, sizeAttenuation: true });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);

      // Mouse tracking
      const mouse = { x: 0, y: 0 };
      const handleMouse = (e) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouse.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      window.addEventListener('mousemove', handleMouse);

      // Resize handler
      const handleResize = () => {
        if (!container.clientWidth) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', handleResize);

      // Animation loop
      const clock = new THREE.Clock();
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        
        // Rotate globe
        globe.rotation.y += 0.002;
        
        // Mouse reactivity
        globe.rotation.x += (mouse.y * 0.2 - globe.rotation.x) * 0.03;
        globe.rotation.z += (-mouse.x * 0.15 - globe.rotation.z) * 0.03;
        
        // Pulse glow
        glowMat.opacity = 0.1 + Math.sin(t * 0.8) * 0.04;
        
        // Rotate particles
        particles.rotation.y = t * 0.03;
        particles.rotation.x = Math.sin(t * 0.015) * 0.15;

        // Float effect
        globe.position.y = Math.sin(t * 0.6) * 0.08;

        renderer.render(scene, camera);
      };
      animate();

      // Cleanup
      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('mousemove', handleMouse);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    } catch (err) {
      console.error('Globe error:', err);
      setError(err.message);
    }
  }, []);

  if (error) return null;

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
}
