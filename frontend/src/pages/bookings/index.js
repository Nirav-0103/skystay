import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { bookingAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMapPin, FiCalendar, FiClock, FiFileText, FiLock } from 'react-icons/fi';
import { MdFlight, MdHotel } from 'react-icons/md';

const STATUS_CONFIG = {
  confirmed: { bg: '#d1fae5', color: '#065f46', label: '✅ Confirmed', bar: '#10b981' },
  pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending Review', bar: '#f59e0b' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: '❌ Cancelled', bar: '#ef4444' },
  completed: { bg: '#e0e7ff', color: '#3730a3', label: '✔️ Completed', bar: '#6366f1' },
  refund_requested: { bg: '#fef3c7', color: '#92400e', label: '🔄 Refund Requested', bar: '#f97316' },
  refunded: { bg: '#dbeafe', color: '#1e40af', label: '💰 Refunded', bar: '#3b82f6' },
};

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error('Please login to view your bookings');
      router.push('/');
      return;
    }
    bookingAPI.getMyBookings()
      .then(r => { setBookings(r.data.bookings || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, authLoading]);

  const filtered = filter === 'all' ? bookings : bookings.filter(b =>
    filter === 'hotel' ? b.bookingType === 'hotel' :
    filter === 'flight' ? b.bookingType === 'flight' :
    b.status === filter
  );

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingAPI.cancel(id, 'User requested cancellation');
      toast.success('Cancellation request submitted!');
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'refund_requested' } : b));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'hotel', label: '🏨 Hotels' },
    { key: 'flight', label: '✈️ Flights' },
    { key: 'confirmed', label: '✅ Confirmed' },
    { key: 'pending', label: '⏳ Pending' },
    { key: 'cancelled', label: '❌ Cancelled' },
  ];

  if (authLoading || loading) return (
    <>
      <Head><title>My Bookings - SkyStay</title></Head>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loader" />
      </div>
    </>
  );

  return (
    <>
      <Head><title>My Bookings - SkyStay</title></Head>
      <Navbar />
      <div className="page-header">
        <div className="container">
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)' }}>My Bookings</h1>
          <p style={{ opacity: 0.8, marginTop: 4 }}>{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1.5px solid', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                background: filter === f.key ? 'var(--primary)' : 'white',
                color: filter === f.key ? 'white' : 'var(--text-secondary)',
                borderColor: filter === f.key ? 'var(--primary)' : 'var(--border)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
            <h3 style={{ marginBottom: 8 }}>No bookings found</h3>
            <p style={{ marginBottom: 20, color: 'var(--text-muted)' }}>
              {filter === 'all' ? "You haven't made any bookings yet" : `No ${filter} bookings found`}
            </p>
            <Link href="/hotels"><button className="btn btn-primary">Explore Hotels</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((booking, i) => {
              // FIX: COD + refund_requested = Cancelled (no payment made, so no actual refund)
              const isCod = booking.paymentMethod === 'cod';
              const effectiveStatus = (isCod && booking.status === 'refund_requested') ? 'cancelled' : booking.status;
              const statusCfg = STATUS_CONFIG[effectiveStatus] || { bg: '#f1f5f9', color: '#475569', label: effectiveStatus, bar: '#94a3b8' };
              const isHotel = booking.bookingType === 'hotel';
              const imgUrl = isHotel ? booking.hotel?.images?.[0] : null;

              // FIX: Show "Pay at Hotel" instead of "COD"
              const paymentMethodLabel = isCod ? 'Pay at Hotel' : booking.paymentMethod;

              return (
                <div key={booking._id}
                  style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animation: `fadeInUp 0.4s ease ${i * 0.05}s both`, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                  {/* Status colour bar at top */}
                  <div style={{ height: 4, background: statusCfg.bar }} />

                  <div style={{ display: 'flex', gap: 0 }}>
                    {/* Hotel Image with Status Overlay */}
                    {imgUrl && (
                      <div style={{ width: 140, flexShrink: 0, position: 'relative', display: 'flex' }}>
                        <img src={imgUrl} alt={booking.hotel?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => e.target.parentElement.style.display='none'} />
                        {/* Status badge overlay on image */}
                        <div style={{ position: 'absolute', top: 8, left: 8, background: statusCfg.bar, color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
                          {statusCfg.label}
                        </div>
                      </div>
                    )}

                    <div style={{ flex: 1, padding: 'clamp(14px, 2.5vw, 20px)' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 40, height: 40, background: isHotel ? 'var(--primary-light)' : '#e0f2fe', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isHotel ? <MdHotel size={20} color="var(--primary)" /> : <MdFlight size={20} color="#0284c7" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>
                              {isHotel ? booking.hotel?.name : `${booking.flight?.from || booking.from} → ${booking.flight?.to || booking.to}`}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 1, fontFamily: 'monospace' }}>
                              #{booking.bookingId}
                            </div>
                          </div>
                        </div>
                        {!imgUrl && (
                          <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', background: statusCfg.bg, color: statusCfg.color, fontSize: '0.75rem', fontWeight: 700 }}>
                            {statusCfg.label}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14, fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                        {isHotel ? (
                          <>
                            <span><FiMapPin size={11} style={{ display: 'inline', marginRight: 3 }} />{booking.hotel?.city}</span>
                            {booking.checkIn && <span><FiCalendar size={11} style={{ display: 'inline', marginRight: 3 }} />{new Date(booking.checkIn).toLocaleDateString('en-IN')} → {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('en-IN') : ''}</span>}
                            <span>🛏️ {booking.roomType} • {booking.nights || 1} night{booking.nights > 1 ? 's' : ''} • {booking.guests || 1} guest{booking.guests > 1 ? 's' : ''}</span>
                          </>
                        ) : (
                          <>
                            <span><MdFlight size={11} style={{ display: 'inline', marginRight: 3 }} />{booking.flight?.airline} {booking.flight?.flightNumber}</span>
                            <span><FiClock size={11} style={{ display: 'inline', marginRight: 3 }} />{booking.flight?.departureTime} → {booking.flight?.arrivalTime}</span>
                            {booking.travelDate && <span><FiCalendar size={11} style={{ display: 'inline', marginRight: 3 }} />{new Date(booking.travelDate).toLocaleDateString('en-IN')}</span>}
                            <span>💺 {booking.seatClass} • {booking.passengers || 1} pax</span>
                          </>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="booking-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Total: </span>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                          {/* FIX: Show "Pay at Hotel" label instead of "cod" */}
                          {booking.paymentMethod && (
                            <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                              {paymentMethodLabel}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link href={`/bookings/bill/${booking._id}`}>
                            <button className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                              <FiFileText size={12} /> Invoice
                            </button>
                          </Link>
                          <Link href={`/bookings/${booking._id}`}>
                            <button className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>Details</button>
                          </Link>
                          {['confirmed', 'pending'].includes(booking.status) && !isCod && (
                            <button className="btn btn-sm" onClick={() => handleCancel(booking._id)}
                              style={{ background: '#fee2e2', color: '#ef4444', border: 'none', fontSize: '0.8rem' }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}