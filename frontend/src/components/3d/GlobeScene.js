import { useRef, useEffect, useState } from 'react';

// We use vanilla Three.js instead of React Three Fiber for maximum compatibility
let THREE;
if (typeof window !== 'undefined') {
  THREE = require('three');
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
      camera.position.z = 5;

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

      // Premium Dark Transparent Sphere (Core)
      const coreGeo = new THREE.SphereGeometry(1.9, 64, 64);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x071124, transparent: true, opacity: 0.8 });
      globe.add(new THREE.Mesh(coreGeo, coreMat));

      // Golden/Blue Wireframe overlay
      const wireGeo = new THREE.SphereGeometry(1.95, 48, 48);
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.15 });
      globe.add(new THREE.Mesh(wireGeo, wireMat));

      // Inner glow
      const glowGeo = new THREE.SphereGeometry(1.98, 48, 48);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.1, side: THREE.BackSide, blending: THREE.AdditiveBlending });
      globe.add(new THREE.Mesh(glowGeo, glowMat));

      // Aura / Premium Waves around the Earth (360 degrees)
      const waves = [];
      const waveCount = 35;
      
      for (let i = 0; i < waveCount; i++) {
        // Dynamic radius for 360 layered effect
        const radius = 2.05 + (Math.random() * 0.45); 
        const waveGeo = new THREE.TorusGeometry(radius, 0.002 + Math.random() * 0.004, 16, 120);
        const waveMat = new THREE.MeshBasicMaterial({ 
          color: 0xf5d580, // Luxury gold/champagne color
          transparent: true, 
          opacity: 0.1 + Math.random() * 0.15,
          blending: THREE.AdditiveBlending
        });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        
        // Random initial rotations all around the sphere
        wave.rotation.x = Math.random() * Math.PI * 2;
        wave.rotation.y = Math.random() * Math.PI * 2;
        wave.rotation.z = Math.random() * Math.PI * 2;
        
        // Save custom animation data
        wave.userData = {
          speedX: (Math.random() - 0.5) * 0.005,
          speedY: (Math.random() - 0.5) * 0.005,
          speedZ: (Math.random() - 0.5) * 0.005,
          pulseSpeed: 0.5 + Math.random() * 1.5,
          pulsePhase: Math.random() * Math.PI * 2,
          baseScale: 1
        };
        
        globe.add(wave);
        waves.push(wave);
      }

      // Premium Stardust Particles (Golden and soft blue)
      const particleCount = 300;
      const pGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(particleCount * 3);
      const pColors = new Float32Array(particleCount * 3);
      
      const goldColor = new THREE.Color(0xf5d580);
      const blueColor = new THREE.Color(0x93c5fd);

      for (let i = 0; i < particleCount; i++) {
        // Distribute particles in a spherical shell area around globe
        const radius = 2.5 + Math.random() * 3;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        pPositions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
        pPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        pPositions[i * 3 + 2] = radius * Math.cos(phi);

        // Mix gold and blue particles
        const isGold = Math.random() > 0.6;
        const color = isGold ? goldColor : blueColor;
        pColors[i * 3] = color.r;
        pColors[i * 3 + 1] = color.g;
        pColors[i * 3 + 2] = color.b;
      }
      
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
      
      const pMat = new THREE.PointsMaterial({ 
        size: 0.035, 
        transparent: true, 
        opacity: 0.7, 
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true 
      });
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
        globe.rotation.y += 0.001;
        globe.rotation.x += 0.0005;
        
        // Smooth mouse reactivity
        globe.rotation.x += (mouse.y * 0.15 - globe.rotation.x) * 0.02;
        globe.rotation.z += (-mouse.x * 0.15 - globe.rotation.z) * 0.02;
        
        // Pulse glow
        glowMat.opacity = 0.08 + Math.sin(t * 1.2) * 0.03;
        
        // Animate premium waves
        waves.forEach(wave => {
          wave.rotation.x += wave.userData.speedX;
          wave.rotation.y += wave.userData.speedY;
          wave.rotation.z += wave.userData.speedZ;
          
          // Breathing scale effect
          const scale = wave.userData.baseScale + Math.sin(t * wave.userData.pulseSpeed + wave.userData.pulsePhase) * 0.03;
          wave.scale.set(scale, scale, scale);
        });

        // Rotate particles smoothly
        particles.rotation.y = t * 0.04;
        particles.rotation.x = Math.sin(t * 0.02) * 0.1;

        // Elegant floating effect
        globe.position.y = Math.sin(t * 0.5) * 0.1;

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
