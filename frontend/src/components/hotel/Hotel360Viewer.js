import { Pannellum } from 'pannellum-react';
import { FiX } from 'react-icons/fi';
import { useEffect } from 'react';

export default function Hotel360Viewer({ onClose, imageUrl }) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(rgba(0,0,0,0.8), transparent)',
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 10
      }}>
        <div>
          <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em' }}>VIRTUAL EXPERIENCE</div>
          <h2 style={{ color: 'white', margin: 0, fontFamily: 'Syne', fontWeight: 800 }}>360° Room Tour</h2>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <FiX size={24} />
        </button>
      </div>

      <div style={{ flex: 1, width: '100%', position: 'relative' }}>
        <Pannellum
          width="100%"
          height="100%"
          image={imageUrl || "https://pannellum.org/images/alma.jpg"}
          pitch={10}
          yaw={180}
          hfov={110}
          autoLoad
          showZoomCtrl={false}
          onLoad={() => {
            console.log("360 panorama loaded");
          }}
        />
        
        {/* Helper text overlay */}
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
          padding: '12px 24px', borderRadius: 'var(--radius-full)', color: 'white',
          fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
          pointerEvents: 'none', animation: 'fadeOut 5s forwards 3s'
        }}>
          <span>👆</span> Drag to look around
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
