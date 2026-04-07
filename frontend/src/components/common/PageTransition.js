import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

export default function PageTransition({ children }) {
  const router = useRouter();

  return (
    <div key={router.asPath}>
      {children}
      
      {/* Cinematic Transition Curtain */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 0, scaleY: 0 }}
        exit={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(to bottom, #050a18, #0a1628)',
          zIndex: 999999, // Below toaster but above everything else
          transformOrigin: 'bottom',
          pointerEvents: 'none'
        }}
      />
      <motion.div
        initial={{ opacity: 1, scaleY: 1 }}
        animate={{ opacity: 0, scaleY: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(to top, #050a18, #0a1628)',
          zIndex: 999999,
          transformOrigin: 'top',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{fontFamily: 'Syne', fontWeight: 800, fontSize: '2rem', color: '#fbbf24', letterSpacing: '0.1em'}}
        >
          SKYSTAY
        </motion.div>
      </motion.div>
    </div>
  );
}
