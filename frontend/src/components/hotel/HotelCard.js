import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiMapPin, FiWifi, FiHeart } from 'react-icons/fi';
import { MdPool, MdSpa, MdRestaurant } from 'react-icons/md';

const amenityIcons = { WiFi: <FiWifi size={12}/>, Pool: <MdPool size={12}/>, Spa: <MdSpa size={12}/>, Restaurant: <MdRestaurant size={12}/> };

export default function HotelCard({ hotel }) {
  const { user, updateUser } = useAuth() || {};
  const { formatPrice = (p) => p?.toLocaleString() } = useCurrency() || {};
  const [liked, setLiked] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (user?.wishlistHotels) {
      setLiked(user.wishlistHotels.some(id => id === hotel._id || id._id === hotel._id));
    }
  }, [user, hotel._id]);

  const toggleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error('Please login to save to wishlist');

    try {
      const res = await authAPI.toggleWishlist({ type: 'hotel', id: hotel._id });
      setLiked(res.data.isWishlisted);
      
      // Update local user state
      const newWishlist = res.data.isWishlisted 
        ? [...(user.wishlistHotels || []), hotel._id]
        : (user.wishlistHotels || []).filter(id => (id._id || id) !== hotel._id);
      
      updateUser({ ...user, wishlistHotels: newWishlist });
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  const img = hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600';

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor = 'rgba(26,110,245,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}>

      {/* Image */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: '#f0f0f0' }}>
        {!imgLoaded && <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />}
        <img src={img} alt={hotel.name}
          onLoad={() => setImgLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', opacity: imgLoaded ? 1 : 0 }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'} />

        {/* Overlay on hover */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)', opacity: 0, transition: 'opacity 0.3s' }}
          onMouseEnter={e => e.target.style.opacity = 1}
          onMouseLeave={e => e.target.style.opacity = 0} />

        {/* Rating badge */}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span className="rating">⭐ {hotel.rating?.toFixed(1)}</span>
        </div>

        {/* Price badge */}
        <div style={{ position: 'absolute', top: 12, right: 44, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontWeight: 800, fontSize: '0.82rem', color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
          {formatPrice(hotel.pricePerNight)}/night
        </div>

        {/* Like button */}
        <button onClick={toggleLike}
          style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', transform: liked ? 'scale(1.2)' : 'scale(1)' }}>
          <FiHeart size={14} color={liked ? '#ef4444' : '#9aa5b1'} fill={liked ? '#ef4444' : 'none'} />
        </button>

        {hotel.featured && (
          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'linear-gradient(135deg, #d4af37, #f5d580)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 800, color: '#2a1f00' }}>
            ✨ Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px 18px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.98rem', marginBottom: 5, color: 'var(--text-primary)', lineHeight: 1.3, transition: 'color 0.2s' }}
          onMouseEnter={e => e.target.style.color = 'var(--primary)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}>
          {hotel.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 10 }}>
          <FiMapPin size={12} /> {hotel.city}
          <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontSize: '0.75rem' }}>{hotel.reviewCount?.toLocaleString()} reviews</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {hotel.description}
        </p>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
          {hotel.amenities?.slice(0, 4).map(a => (
            <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}>
              {amenityIcons[a]} {a}
            </span>
          ))}
        </div>

        <Link href={`/hotels/${hotel._id}`}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            View Details →
          </button>
        </Link>
      </div>
    </div>
  );
}