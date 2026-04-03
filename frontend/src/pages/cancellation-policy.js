import Head from 'next/head';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

export default function CancellationPolicy() {
  return (
    <>
      <Head><title>Cancellation Policy - SkyStay</title></Head>
      <Navbar />
      <div className="page-header">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: 8 }}>Cancellation Policy ❌</h1>
          <p style={{ opacity: 0.8 }}>Simple, transparent cancellation terms</p>
        </div>
      </div>
      <div className="container" style={{ padding: '40px 24px 80px', maxWidth: 800 }}>

        {/* Hotel Policy */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.2rem', marginBottom: 20 }}>🏨 Hotel Cancellation</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { time: '24+ hours before check-in', refund: '100% Full Refund', icon: <FiCheck color="var(--success)" />, color: '#d1fae5' },
              { time: '12-24 hours before check-in', refund: '50% Refund', icon: <FiAlertCircle color="var(--warning)" />, color: '#fef3c7' },
              { time: 'Less than 12 hours / No-show', refund: 'No Refund', icon: <FiX color="var(--danger)" />, color: '#fee2e2' },
            ].map(r => (
              <div key={r.time} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: r.color, borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.2rem' }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.time}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{r.refund}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Flight Policy */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.2rem', marginBottom: 20 }}>✈️ Flight Cancellation</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { time: '48+ hours before departure', refund: '100% Full Refund', icon: <FiCheck color="var(--success)" />, color: '#d1fae5' },
              { time: '24-48 hours before departure', refund: '75% Refund', icon: <FiAlertCircle color="var(--warning)" />, color: '#fef3c7' },
              { time: 'Less than 24 hours', refund: '25% Refund', icon: <FiAlertCircle color="var(--danger)" />, color: '#fee2e2' },
            ].map(r => (
              <div key={r.time} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: r.color, borderRadius: 'var(--radius-md)' }}>
                <div>{r.icon}</div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.time}</div></div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{r.refund}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How to cancel */}
        <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-xl)', padding: 24, border: '1px solid rgba(26,110,245,0.15)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--primary)' }}>How to Cancel?</h3>
          {['Go to "My Bookings" in your profile', 'Select the booking you want to cancel', 'Click "Cancel Booking" button', 'Confirm your cancellation reason', 'Admin will process your request within 24 hours', 'Refund credited within 5-7 business days'].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', paddingTop: 3 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}