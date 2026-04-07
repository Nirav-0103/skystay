import { useEffect, useRef } from 'react';

export default function LuxuryCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    // Only run on desktop to prevent mobile touch issues
    if (window.matchMedia("(max-width: 768px)").matches) return;

    let rafId;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      if (cursorRef.current) {
        // Center the 800px diameter gradient exactly on the cursor
        cursorRef.current.style.transform = `translate3d(${mouseX - 400}px, ${mouseY - 400}px, 0)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div 
        ref={cursorRef} 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, rgba(26, 110, 245, 0.05) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 9999, // Floating above everything
          mixBlendMode: 'screen', // This combines lighting beautifully with dark backgrounds
          willChange: 'transform',
          transition: 'opacity 0.5s ease',
        }}
      />
      {/* Global CSS to enhance the luxury feel for the body */}
      <style global jsx>{`
        body {
          /* Add subtle luxury dark grid texture globally */
          background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 30px 30px;
        }
      `}</style>
    </>
  );
}
