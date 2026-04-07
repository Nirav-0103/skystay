import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import PaymentModal from '../../components/payment/PaymentModal';
import { hotelAPI, bookingAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import toast from 'react-hot-toast';
import { FiMapPin, FiCheck, FiImage, FiStar, FiMessageSquare, FiUser, FiClock, FiSend, FiZap, FiBox } from 'react-icons/fi';
import dynamic from 'next/dynamic';

const Hotel360Viewer = dynamic(() => import('../../components/hotel/Hotel360Viewer'), { ssr: false });

// ✅ Placeholder when no image / image fails to load
function ImagePlaceholder({ name }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #1a6ef5 60%, #0ea5e9 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12
    }}>
      <div style={{ fontSize: '4rem', opacity: 0.6 }}>🏨</div>
      <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', padding: '0 24px' }}>
        {name}
      </div>
    </div>
  );
}

export default function HotelDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth() || {};
  const { formatPrice = (p) => p?.toLocaleString() } = useCurrency() || {};
  const { addNotification = () => {} } = useNotifications() || {};
  const [hotel, setHotel] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [imgErrors, setImgErrors] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [booking, setBooking] = useState({ checkIn: '', checkOut: '', guests: 1 });
  const [showPayment, setShowPayment] = useState(false);
  const [show360, setShow360] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const fetchHotel = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await hotelAPI.getById(id);
      if (res.data.success) {
        setHotel(res.data.hotel);
        setWeather(res.data.weather);
      }
    } catch (err) {
      console.error('Fetch hotel error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotel();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please sign in to leave a review');
    if (!reviewForm.comment.trim()) return toast.error('Please write a comment');

    setSubmittingReview(true);
    try {
      await hotelAPI.addReview(id, reviewForm);
      toast.success('Review added successfully!');
      setReviewForm({ rating: 5, comment: '' });
      fetchHotel();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add review');
    }
    setSubmittingReview(false);
  };

  const nights = booking.checkIn && booking.checkOut
    ? Math.max(0, Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000))
    : 0;

  const room = (hotel?.roomTypes && hotel.roomTypes.length > 0)
    ? hotel.roomTypes[selectedRoom]
    : { name: 'Standard Room', price: hotel?.pricePerNight || 0, capacity: 2, available: 10 };

  const total = room && nights > 0 ? room.price * nights * (booking.guests || 1) : 0;

  const validImages = (hotel?.images || []).filter(img => img && typeof img === 'string' && img.trim() !== '');
  const hasImages = validImages.length > 0;
  const currentImgBroken = imgErrors[activeImg];

  const handleImgError = (i) => {
    setImgErrors(prev => ({ ...prev, [i]: true }));
  };

  const handleBookNow = () => {
    if (!user) { toast.error('Please sign in to book'); return; }
    if (!booking.checkIn || !booking.checkOut) { toast.error('Please select dates'); return; }
    if (nights <= 0) { toast.error('Check-out must be after check-in'); return; }
    setShowPayment(true);
  };

  // ✅ FIXED: properly handle booking creation and avoid false error toasts
  const handlePaymentSuccess = async (paymentMethod, paymentDetails = {}) => {
    try {
      const res = await bookingAPI.create({
        bookingType: 'hotel', hotel: id, roomType: room.name,
        checkIn: booking.checkIn, checkOut: booking.checkOut,
        guests: booking.guests, paymentMethod, paymentDetails, totalAmount: total
      });

      if (!res.data.booking?._id) throw new Error('No booking ID returned');

      if (paymentDetails.status === 'failed') {
        toast.error('Payment failed. An automatic refund has been initiated.');
        router.push('/refunds');
        return;
      }

      addNotification({
        title: 'Booking Received! 🏨',
        message: `Your booking for ${hotel.name} is being processed.`,
        type: 'booking'
      });

      await router.push(`/bookings/${res.data.booking._id}`);
    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err.response?.data?.message || 'Booking creation failed');
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loader" />
      </div>
    </>
  );

  if (!hotel) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: 100 }}>Hotel not found</div>
    </>
  );

  return (
    <>
      <Head><title>{hotel.name} - SkyStay</title></Head>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>

        {/* ── Image Gallery ── */}
        <div style={{ marginBottom: 24, borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>

          {/* Main Image */}
          <div style={{
            height: 'clamp(220px, 40vw, 420px)',
            background: '#e5e7eb',
            overflow: 'hidden',
            borderRadius: 'var(--radius-xl)',
            position: 'relative'
          }}>
            {(!hasImages || currentImgBroken) ? (
              <ImagePlaceholder name={hotel.name} />
            ) : (
              <>
                <img
                  key={activeImg}
                  src={validImages[activeImg]}
                  alt={hotel.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={() => handleImgError(activeImg)}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
                  pointerEvents: 'none'
                }} />
                <button onClick={() => setShow360(true)}
                  style={{
                    position: 'absolute', top: 20, right: 20,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                    color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                    padding: '10px 20px', borderRadius: 'var(--radius-full)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                >
                  <FiBox size={18} /> 360° Virtual Tour
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {hasImages && validImages.length > 1 && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 0', overflowX: 'auto' }}>
              {validImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 72, height: 50, borderRadius: 8, overflow: 'hidden',
                    cursor: 'pointer', flexShrink: 0,
                    border: `3px solid ${activeImg === i ? 'var(--primary)' : 'transparent'}`,
                    background: '#e5e7eb'
                  }}>
                  {imgErrors[i] ? (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1a6ef5,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiImage size={14} color="white" />
                    </div>
                  ) : (
                    <img
                      src={img} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => handleImgError(i)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Detail + Booking Grid ── */}
        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>

          {/* Left */}
          <div className="main-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)' }}>{hotel.name}</h1>
              <span className="rating">⭐ {hotel.rating?.toFixed(1)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
              <FiMapPin size={14} /> {hotel.address}
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24, fontSize: '0.95rem' }}>
              {hotel.description}
            </p>

            {/* Live Weather Widget */}
            {weather && (
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 24, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: '2.5rem' }}>
                    {weather.icon ? (
                      <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.condition} style={{ width: 60, height: 60 }} />
                    ) : '☀️'}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{weather.temp}°C</div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{weather.condition} in {hotel.city}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>HUMIDITY</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{weather.humidity}%</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>WIND</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{weather.windSpeed} km/h</div>
                  </div>
                </div>
              </div>
            )}

            {/* Amenities */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: '1rem' }}>Amenities</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {hotel.amenities?.map(a => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    <FiCheck color="var(--success)" size={14} /> {a}
                  </div>
                ))}
              </div>
            </div>

            {/* Room Types */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: '1rem' }}>Select Room Type</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(!hotel.roomTypes || hotel.roomTypes.length === 0) ? (
                  <div
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 18px', borderRadius: 'var(--radius-md)',
                      border: '2px solid var(--primary)',
                      background: 'var(--primary-light)',
                      cursor: 'default', transition: 'all 0.2s'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        border: '2px solid var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--primary)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>Standard Room</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Up to 2 guests · 10 rooms left
                        </div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      {formatPrice(hotel.pricePerNight || 0)}/night
                    </span>
                  </div>
                ) : (
                  hotel.roomTypes.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedRoom(i)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 18px', borderRadius: 'var(--radius-md)',
                        border: `2px solid ${selectedRoom === i ? 'var(--primary)' : 'var(--border)'}`,
                        background: selectedRoom === i ? 'var(--primary-light)' : 'white',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `2px solid ${selectedRoom === i ? 'var(--primary)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {selectedRoom === i && (
                            <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--primary)' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>{r.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Up to {r.capacity} guests · {r.available} rooms left
                          </div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                        {formatPrice(r.price)}/night
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Reviews Section ── */}
            <div style={{ marginTop: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FiMessageSquare color="var(--primary)" /> Guest Reviews ({hotel.reviewCount || 0})
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary-light)', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}>
                  <FiStar color="#fbbf24" fill="#fbbf24" size={16} />
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{hotel.rating?.toFixed(1)}</span>
                </div>
              </div>

              {/* Add Review Form */}
              {user ? (
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 32, border: '1.5px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Leave a Review</h4>
                  <form onSubmit={handleReviewSubmit}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Your Rating:</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: reviewForm.rating >= star ? '#fbbf24' : 'var(--text-muted)' }}>
                            <FiStar size={18} fill={reviewForm.rating >= star ? '#fbbf24' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      placeholder="Share your experience at this hotel..."
                      style={{ width: '100%', minHeight: 100, padding: 14, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', fontSize: '0.9rem', marginBottom: 16, outline: 'none', transition: 'var(--transition)' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      value={reviewForm.comment}
                      onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    />
                    <button type="submit" disabled={submittingReview} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.88rem' }}>
                      {submittingReview ? 'Posting...' : <><FiSend size={14} /> Post Review</>}
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 32, textAlign: 'center', border: '1.5px dashed var(--border)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 12 }}>Please sign in to share your review.</p>
                  <button onClick={() => router.push('/')} className="btn btn-outline btn-sm">Sign In Now</button>
                </div>
              )}

              {/* Review List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {(!hotel.reviews || hotel.reviews.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <FiMessageSquare size={32} style={{ marginBottom: 12, opacity: 0.2 }} />
                    <div style={{ fontSize: '0.9rem' }}>No reviews yet. Be the first to review!</div>
                  </div>
                ) : (
                  hotel.reviews.map((rev, idx) => (
                    <div key={rev._id || idx} style={{ paddingBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                            {rev.user?.avatar ? <img src={rev.user.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <FiUser size={18} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{rev.name || rev.user?.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24' }}>
                              {[...Array(5)].map((_, i) => <FiStar key={i} size={12} fill={i < rev.rating ? '#fbbf24' : 'none'} color={i < rev.rating ? '#fbbf24' : 'var(--text-muted)'} />)}
                            </div>
                          </div>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiClock size={12} /> {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, paddingLeft: 52 }}>
                        {rev.comment}
                      </p>
                    </div>
                  )).reverse()
                )}
              </div>
            </div>
          </div>

          {/* Right - Booking Box */}
          <div className="sidebar-booking">
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 24, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', position: 'sticky', top: 90 }}>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(room.price)}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}> / night</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                <div className="input-group">
                  <label className="input-label">CHECK-IN</label>
                  <input type="date" className="input-field" min={today} value={booking.checkIn} onChange={e => setBooking({ ...booking, checkIn: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">CHECK-OUT</label>
                  <input type="date" className="input-field" min={booking.checkIn || today} value={booking.checkOut} onChange={e => setBooking({ ...booking, checkOut: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">GUESTS</label>
                  <select className="input-field" value={booking.guests} onChange={e => setBooking({ ...booking, guests: Number(e.target.value) })}>
                    {[...Array(30)].map((_, i) => <option key={i} value={i + 1}>{i + 1} Guests</option>)}
                  </select>
                </div>
              </div>

              {nights > 0 && (
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                    <span>{formatPrice(room.price)} x {nights} nights</span>
                    <span>{formatPrice(room.price * nights)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem', color: 'var(--success)', fontWeight: 600 }}>
                    <span>Service Fee</span>
                    <span>Free</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 8, fontWeight: 800 }}>
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700 }}>
                    <FiZap size={12} fill="var(--primary)" />
                    <span>Earn {Math.floor(total * 0.01)} SkyPoints with this booking</span>
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleBookNow}>
                {user ? '🔒 Book Now' : 'Sign In to Book'}
              </button>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 12 }}>You won't be charged yet</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {show360 && (
        <Hotel360Viewer 
          onClose={() => setShow360(false)} 
          imageUrl="/images/room-360.jpg" // Ultra realistic Luxury Hotel Room Equirectangular Panorama
        />
      )}

      {showPayment && (
        <PaymentModal
          amount={total}
          bookingData={{ bookingType: 'hotel' }}
          user={user}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}

      <style jsx>{`
        @media (max-width: 992px) {
          .detail-grid { grid-template-columns: 1fr !important; }
          .sidebar-booking { position: static !important; margin-top: 32px; }
          .sidebar-booking > div { position: static !important; }
        }
      `}</style>
    </>
  );
}