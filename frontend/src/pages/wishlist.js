import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import HotelCard from '../components/hotel/HotelCard';
import FlightCard from '../components/flight/FlightCard';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiHeart, FiSearch } from 'react-icons/fi';
import Link from 'next/link';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState({ hotels: [], flights: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hotels');

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getWishlist();
      setWishlist({ hotels: res.data.hotels, flights: res.data.flights });
    } catch (err) {
      console.error('Failed to fetch wishlist');
    }
    setLoading(false);
  };

  if (authLoading) return <div className="loader-container"><div className="loader" /></div>;

  if (!user) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
        <FiHeart size={60} color="var(--text-muted)" style={{ marginBottom: 24, opacity: 0.5 }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>Your Wishlist</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Please sign in to view and manage your saved favorites.</p>
        <button className="btn btn-primary btn-lg">Sign In Now</button>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Head><title>My Wishlist - SkyStay</title></Head>
      <Navbar />
      <div className="page-header" style={{ background: 'linear-gradient(135deg, var(--primary), #0e4fc4)', padding: '60px 0', color: 'white' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiHeart size={24} fill="white" />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Syne' }}>My Wishlist</h1>
          </div>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>Your saved dream hotels and flights</p>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 20px 80px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <button onClick={() => setActiveTab('hotels')}
            style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', border: 'none', background: activeTab === 'hotels' ? 'var(--primary)' : 'transparent', color: activeTab === 'hotels' ? 'white' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            Hotels ({wishlist.hotels.length})
          </button>
          <button onClick={() => setActiveTab('flights')}
            style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', border: 'none', background: activeTab === 'flights' ? 'var(--primary)' : 'transparent', color: activeTab === 'flights' ? 'white' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            Flights ({wishlist.flights.length})
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><div className="loader" /></div>
        ) : (
          <div>
            {activeTab === 'hotels' ? (
              wishlist.hotels.length === 0 ? (
                <EmptyState type="hotels" />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                  {wishlist.hotels.map(hotel => <HotelCard key={hotel._id} hotel={hotel} />)}
                </div>
              )
            ) : (
              wishlist.flights.length === 0 ? (
                <EmptyState type="flights" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {wishlist.flights.map(flight => <FlightCard key={flight._id} flight={flight} />)}
                </div>
              )
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

function EmptyState({ type }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border)' }}>
      <div style={{ fontSize: '4rem', marginBottom: 20, opacity: 0.3 }}>{type === 'hotels' ? '🏨' : '✈️'}</div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>No saved {type} yet</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Explore and save your favorite {type} to see them here.</p>
      <Link href={type === 'hotels' ? '/hotels' : '/flights'}>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}>
          <FiSearch size={16} /> Browse {type === 'hotels' ? 'Hotels' : 'Flights'}
        </button>
      </Link>
    </div>
  );
}
