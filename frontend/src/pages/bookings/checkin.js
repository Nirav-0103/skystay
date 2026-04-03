import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { bookingAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { MdFlight, MdQrCode } from 'react-icons/md';
import { FiCheck } from 'react-icons/fi';

export default function CheckinPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [boardingPass, setBoardingPass] = useState(null);
  const [booking, setBooking] = useState(null);

  const handleCheckin = async () => {
    if (!bookingId.trim()) { toast.error('Enter your booking ID'); return; }
    if (!user) { toast.error('Please sign in first'); return; }
    setLoading(true);
    try {
      // Find booking by bookingId string
      const myBookings = await bookingAPI.getMyBookings();
      const found = myBookings.data.bookings?.find(b => b.bookingId === bookingId.toUpperCase().trim());
      if (!found) { toast.error('Booking not found. Check your ID.'); setLoading(false); return; }
      if (found.bookingType !== 'flight') { toast.error('Check-in is only for flight bookings'); setLoading(false); return; }
      const res = await bookingAPI.checkIn(found._id);
      setBoardingPass(res.data.boardingPass);
      setBooking({ ...found, ...res.data.booking });
      toast.success('✅ Check-in successful! Boarding pass ready.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
    setLoading(false);
  };

  return (
    <>
      <Head><title>Web Check-in - SkyStay</title></Head>
      <Navbar />

      <div style={{ background: 'linear-gradient(135deg, #0d1b2e, #1a6ef5)', padding: '40px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✈️</div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, color: 'white', fontSize: 'clamp(1.5rem,3vw,2rem)', marginBottom: 8 }}>Online Check-in</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' }}>Check in online and get your boarding pass instantly</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
        {!boardingPass ? (
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 32, boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Enter Booking Details</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>Your booking ID is in your confirmation email (starts with FLT...)</p>

            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Booking ID</label>
              <input className="input-field" placeholder="e.g. FLT17234567890ABCD" value={bookingId}
                onChange={e => setBookingId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleCheckin()}
                style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }} />
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleCheckin} disabled={loading}>
              {loading
                ? <><div className="loader" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Checking in...</>
                : '✈️ Check In Now'
              }
            </button>

            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg)', borderRadius: 12 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 10 }}>Check-in Guidelines:</div>
              {['Web check-in available 48 hours before departure', 'Carry a printed/digital boarding pass to airport', 'Arrive at airport 2 hours before domestic flights'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <FiCheck size={13} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} /> {t}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Boarding Pass */
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid var(--border)' }}>
              {/* Top */}
              <div style={{ background: 'linear-gradient(135deg, #0d1b2e, #1a6ef5)', padding: '24px 28px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: 600, letterSpacing: '0.08em' }}>BOARDING PASS</div>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>SkyStay</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>STATUS</div>
                    <div style={{ background: '#10b981', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>✅ CHECKED IN</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{booking?.flight?.departureTime}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{booking?.flight?.from}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{booking?.flight?.fromCode || ''}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <MdFlight size={28} style={{ opacity: 0.7 }} />
                    <div style={{ fontSize: '0.72rem', opacity: 0.55, marginTop: 4 }}>{booking?.flight?.duration}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{booking?.flight?.arrivalTime}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{booking?.flight?.to}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{booking?.flight?.toCode || ''}</div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative', padding: '0 -1px' }}>
                <div style={{ width: 20, height: 20, background: 'var(--bg)', borderRadius: '50%', border: '1px solid var(--border)', flexShrink: 0, marginLeft: -10 }} />
                <div style={{ flex: 1, borderTop: '2px dashed var(--border)' }} />
                <div style={{ width: 20, height: 20, background: 'var(--bg)', borderRadius: '50%', border: '1px solid var(--border)', flexShrink: 0, marginRight: -10 }} />
              </div>

              {/* Details */}
              <div style={{ padding: '20px 28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'PASSENGER', value: user?.name },
                    { label: 'CLASS', value: booking?.seatClass },
                    { label: 'SEATS', value: booking?.selectedSeats?.join(', ') || 'Any' },
                    { label: 'BOOKING REF', value: booking?.bookingId },
                    { label: 'FLIGHT', value: booking?.flight?.flightNumber },
                    { label: 'PASSENGERS', value: booking?.passengers },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: item.label.includes('REF') || item.label.includes('FLIGHT') ? 'monospace' : 'inherit' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Barcode area */}
                <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 8 }}>
                    {[...boardingPass].map((c, i) => (
                      <div key={i} style={{ width: Math.random() > 0.5 ? 3 : 1.5, height: 40, background: '#0d1b2e', borderRadius: 1 }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                    {boardingPass}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Print Boarding Pass</button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => router.push('/bookings')}>View All Bookings</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
