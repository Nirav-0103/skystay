import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { bookingAPI, postAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiCheck, FiClock, FiMapPin, FiDownload, FiShare2 } from 'react-icons/fi';
import { MdFlight, MdHotel } from 'react-icons/md';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const BoardingPass = dynamic(() => import('../../components/flight/BoardingPass'), { ssr: false });

const statusConfig = {
  confirmed: { color: '#10b981', bg: '#d1fae5', icon: '✅', label: 'Confirmed' },
  pending: { color: '#f59e0b', bg: '#fef3c7', icon: '⏳', label: 'Pending Approval' },
  cancelled: { color: '#ef4444', bg: '#fee2e2', icon: '❌', label: 'Cancelled' },
  completed: { color: '#6b7280', bg: '#f3f4f6', icon: '✔️', label: 'Completed' },
  refund_requested: { color: '#f59e0b', bg: '#fef3c7', icon: '🔄', label: 'Refund Requested' },
  refunded: { color: '#1a6ef5', bg: '#e8f0fe', icon: '💵', label: 'Refunded' }
};

export default function BookingDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    bookingAPI.getById(id).then(r => { setBooking(r.data.booking); setLoading(false); }).catch(() => setLoading(false));
  }, [id, user]);

  const handleDownloadBoardingPass = async () => {
    const isHotel = booking.bookingType === 'hotel';
    if (isHotel) {
       window.print();
       return;
    }
    
    // Flight PDF Generation
    const passElement = document.getElementById(`boarding-pass-${booking._id}`);
    if (!passElement) return toast.error('Boarding pass not ready');

    const loadingToast = toast.loading('Generating Boarding Pass...');
    try {
      // Temporarily show to calculate styles correctly
      passElement.style.left = '0px';
      passElement.style.zIndex = '-99';
      // Dynamically import to avoid SSR 'window is not defined' issue
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(passElement, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      // Hide again
      passElement.style.left = '-9999px';
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`BoardingPass_${booking.bookingId}.pdf`);
      toast.success('Downloaded Successfully!', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: loadingToast });
      passElement.style.left = '-9999px'; // Ensure it's hidden
    }
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const content = isHotel 
        ? `Just booked a stay at ${booking.hotel?.name} in ${booking.hotel?.city}! Can't wait for my trip! 🏨✨`
        : `Excited for my flight ${booking.flight?.flightNumber} from ${booking.flight?.from} to ${booking.flight?.to}! ✈️🌍`;
      
      await postAPI.create({
        content,
        location: isHotel ? booking.hotel?.city : booking.flight?.to,
        hotel: isHotel ? booking.hotel?._id : null
      });
      toast.success('Trip shared to community feed! 🚀');
      router.push('/feed');
    } catch (err) {
      toast.error('Failed to share trip');
    }
    setSharing(false);
  };

  if (loading) return <><Navbar /><div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><div className="loader" /></div></>;
  if (!booking) return <><Navbar /><div style={{ textAlign: 'center', padding: 100 }}>Booking not found</div></>;

  const isHotel = booking.bookingType === 'hotel';

  // FIX 1: COD + refund_requested = Cancelled (no payment was made, so no refund needed)
  const isCod = booking.paymentMethod === 'cod';
  const effectiveStatus = (isCod && booking.status === 'refund_requested') ? 'cancelled' : booking.status;
  const status = statusConfig[effectiveStatus] || statusConfig.pending;

  // FIX 2: Show "Pay at Hotel" instead of "COD"
  const paymentMethodLabel = isCod ? 'Pay at Hotel' : (booking.paymentMethod || 'Online');

  return (
    <>
      <Head><title>Booking #{booking.bookingId} - SkyStay</title></Head>
      <Navbar />

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 60 }}>
        {/* Status Banner */}
        <div style={{ background: status.bg, border: `2px solid ${status.color}`, borderRadius: 'var(--radius-xl)', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: '2.5rem' }}>{status.icon}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: status.color }}>{status.label}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 2 }}>
              {effectiveStatus === 'pending' ? 'Your booking is awaiting admin confirmation. You will be notified soon!' :
               effectiveStatus === 'confirmed' ? 'Your booking is confirmed! Have a wonderful trip! 🎉' :
               effectiveStatus === 'cancelled' ? 'This booking has been cancelled.' :
               'Booking status updated.'}
            </div>
          </div>
        </div>

        {/* Booking Card */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 20 }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0e4fc4 100%)', padding: '24px 28px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, opacity: 0.85, fontSize: '0.88rem' }}>
                  {isHotel ? <MdHotel size={18} /> : <MdFlight size={18} />}
                  {isHotel ? 'Hotel Booking' : 'Flight Booking'}
                </div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.4rem' }}>
                  {isHotel ? booking.hotel?.name : `${booking.flight?.from} → ${booking.flight?.to}`}
                </div>
                <div style={{ opacity: 0.75, fontSize: '0.82rem', marginTop: 6 }}>Booking ID: #{booking.bookingId}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 600 }}>
                {new Date(booking.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {isHotel ? (
                <>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>CHECK-IN</div>
                    <div style={{ fontWeight: 700 }}>{new Date(booking.checkIn).toDateString()}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>CHECK-OUT</div>
                    <div style={{ fontWeight: 700 }}>{new Date(booking.checkOut).toDateString()}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>ROOM TYPE</div>
                    <div style={{ fontWeight: 700 }}>{booking.roomType}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>DURATION & GUESTS</div>
                    <div style={{ fontWeight: 700 }}>{booking.nights} nights • {booking.guests} guest{booking.guests > 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)', gridColumn: 'span 2' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>LOCATION</div>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><FiMapPin size={14} color="var(--primary)" /> {booking.hotel?.city}</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>AIRLINE</div>
                    <div style={{ fontWeight: 700 }}>{booking.flight?.airline}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>FLIGHT NO.</div>
                    <div style={{ fontWeight: 700 }}>{booking.flight?.flightNumber}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>DEPARTURE</div>
                    <div style={{ fontWeight: 700 }}>{booking.flight?.departureTime} - {booking.flight?.from}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>ARRIVAL</div>
                    <div style={{ fontWeight: 700 }}>{booking.flight?.arrivalTime} - {booking.flight?.to}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>CLASS</div>
                    <div style={{ fontWeight: 700 }}>{booking.seatClass}</div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>PASSENGERS</div>
                    <div style={{ fontWeight: 700 }}>{booking.passengers}</div>
                  </div>
                </>
              )}
            </div>

            {/* Payment Summary */}
            <div style={{ background: 'linear-gradient(135deg, #f8fafd 0%, #e8f0fe 100%)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 20, border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Payment Method</span>
                {/* FIX 2: Show "Pay at Hotel" instead of "COD" */}
                <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{paymentMethodLabel}</span>
              </div>
              {booking.paymentDetails?.transactionId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>Transaction ID</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{booking.paymentDetails.transactionId}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span>Total Paid</span>
                <span style={{ color: 'var(--primary)' }}>₹{booking.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button onClick={handleDownloadBoardingPass} className="btn btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FiDownload size={16} /> {isHotel ? 'Download Invoice' : 'Download Boarding Pass'}
              </button>
              <button 
                onClick={handleShare} 
                disabled={sharing}
                className="btn btn-primary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <FiShare2 size={16} /> {sharing ? 'Sharing...' : 'Share Trip to Feed'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Hidden Boarding Pass for PDF generation */}
      {!isHotel && <BoardingPass booking={booking} />}
    </>
  );
}