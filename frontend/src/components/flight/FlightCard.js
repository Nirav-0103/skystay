import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { MdFlight } from 'react-icons/md';
import { FiClock, FiUsers, FiHeart } from 'react-icons/fi';

export default function FlightCard({ flight, passengers = 1, seatClass = 'Economy' }) {
  const { user, updateUser } = useAuth();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (user?.wishlistFlights) {
      setLiked(user.wishlistFlights.some(id => id === flight._id || id._id === flight._id));
    }
  }, [user, flight._id]);

  const toggleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error('Please login to save to wishlist');

    try {
      const res = await authAPI.toggleWishlist({ type: 'flight', id: flight._id });
      setLiked(res.data.isWishlisted);
      
      const newWishlist = res.data.isWishlisted 
        ? [...(user.wishlistFlights || []), flight._id]
        : (user.wishlistFlights || []).filter(id => (id._id || id) !== flight._id);
      
      updateUser({ ...user, wishlistFlights: newWishlist });
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  const selectedClass = flight.seatClasses?.find(s => s.className === seatClass) || flight.seatClasses?.[0];
  const totalPrice = selectedClass ? selectedClass.price * passengers : flight.basePrice * passengers;

  const airlineColors = { 'Air India': '#c8102e', 'IndiGo': '#0033a0', 'Vistara': '#582c83', 'SpiceJet': '#c8102e' };
  const color = airlineColors[flight.airline] || 'var(--primary)';

  return (
    <div className="card" style={{ padding: 'clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 20px)', flexWrap: 'wrap' }}>
        {/* Airline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
          <div style={{ width: 42, height: 42, background: color + '15', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color, flexShrink: 0 }}>
            {flight.airlineCode}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{flight.airline}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{flight.flightNumber}</div>
          </div>
        </div>

        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 800 }}>{flight.departureTime}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{flight.from}</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              <FiClock size={10} style={{ display: 'inline', marginRight: 2 }} />{flight.duration}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <MdFlight size={13} color="var(--primary)" />
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: flight.stops === 0 ? 'var(--success)' : 'var(--warning)', fontWeight: 600, marginTop: 4 }}>
              {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 800 }}>{flight.arrivalTime}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{flight.to}</div>
          </div>
        </div>

        {/* Price + Book */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button onClick={toggleLike}
            style={{ width: 42, height: 42, borderRadius: '50%', background: liked ? 'rgba(239,68,68,0.1)' : 'var(--bg)', border: '1.5px solid ' + (liked ? '#ef4444' : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', color: liked ? '#ef4444' : 'var(--text-muted)' }}>
            <FiHeart size={18} fill={liked ? '#ef4444' : 'none'} />
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{passengers} pax</div>
            <div style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(totalPrice)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{selectedClass?.seatsAvailable} seats left</div>
          </div>
          <button className="btn btn-primary"
            onClick={() => router.push(`/flights/${flight._id}?passengers=${passengers}&class=${seatClass}`)}>
            Book Now →
          </button>
        </div>
      </div>

      {/* Class tags */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {flight.seatClasses?.map(sc => (
          <span key={sc.className} className={`badge ${sc.className === seatClass ? 'badge-blue' : 'badge-gray'}`}>{sc.className}</span>
        ))}
      </div>
    </div>
  );
}