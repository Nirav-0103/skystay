import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import HotelCard from '../components/hotel/HotelCard';
import TripPlanner from '../components/common/TripPlanner';
import { hotelAPI, aiAPI } from '../utils/api';
import { FiMapPin, FiCalendar, FiUsers, FiSearch, FiZap, FiStar } from 'react-icons/fi';
import { MdFlight, MdHotel, MdSecurity, MdSupportAgent } from 'react-icons/md';

// Dynamic import for 3D Globe (SSR disabled — WebGL only runs in browser)
const GlobeScene = dynamic(() => import('../components/3d/GlobeScene'), { ssr: false });

const CITIES = ['Mumbai', 'Delhi', 'Goa', 'Bangalore', 'Chennai', 'Kolkata', 'Jaipur', 'Udaipur', 'Hyderabad', 'Pune'];
const POPULAR_DESTINATIONS = [
  { city: 'Mumbai', hotels: '120+', img: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600', desc: 'City of Dreams' },
  { city: 'Delhi', hotels: '95+', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600', desc: 'Heart of India' },
  { city: 'Goa', hotels: '85+', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600', desc: 'Beach Paradise' },
  { city: 'Jaipur', hotels: '70+', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600', desc: 'Pink City' },
];

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState('Hotels');
  const [hotelForm, setHotelForm] = useState({ city: '', checkIn: '', checkOut: '', guests: 1 });
  const [flightForm, setFlightForm] = useState({ from: '', to: '', date: '', passengers: 1, tripType: 'oneway' });
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const [aiSearch, setAiSearch] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setHeroVisible(true);
    hotelAPI.getFeatured().then(r => { setFeaturedHotels(r.data.hotels); setLoadingHotels(false); }).catch(() => setLoadingHotels(false));
  }, []);

  const handleAISearch = async () => {
    if (!aiSearch.trim()) return;
    setAiLoading(true);
    try {
      const res = await aiAPI.search(aiSearch);
      const data = res.data;
      if (data.success && data.parsed) {
        const parsed = data.parsed;
        const params = new URLSearchParams();
        if (parsed.type === 'hotel') {
          if (parsed.city) params.set('city', parsed.city);
          if (parsed.checkIn) params.set('checkIn', parsed.checkIn);
          if (parsed.checkOut) params.set('checkOut', parsed.checkOut);
          if (parsed.guests) params.set('guests', parsed.guests);
          if (parsed.maxPrice) params.set('maxPrice', parsed.maxPrice);
          router.push(`/hotels?${params.toString()}`);
        } else {
          if (parsed.from) params.set('from', parsed.from);
          if (parsed.to) params.set('to', parsed.to);
          if (parsed.date) params.set('date', parsed.date);
          if (parsed.passengers) params.set('passengers', parsed.passengers);
          if (parsed.seatClass) params.set('seatClass', parsed.seatClass);
          router.push(`/flights?${params.toString()}`);
        }
      }
    } catch (err) { console.error(err); }
    setAiLoading(false);
  };

  const searchHotels = () => {
    const params = new URLSearchParams();
    if (hotelForm.city) params.set('city', hotelForm.city);
    if (hotelForm.checkIn) params.set('checkIn', hotelForm.checkIn);
    if (hotelForm.checkOut) params.set('checkOut', hotelForm.checkOut);
    if (hotelForm.guests) params.set('guests', hotelForm.guests);
    router.push(`/hotels?${params.toString()}`);
  };

  const searchFlights = () => {
    const params = new URLSearchParams();
    if (flightForm.from) params.set('from', flightForm.from);
    if (flightForm.to) params.set('to', flightForm.to);
    if (flightForm.date) params.set('date', flightForm.date);
    params.set('passengers', flightForm.passengers);
    router.push(`/flights?${params.toString()}`);
  };

  return (
    <>
      <Head><title>SkyStay - Luxury Hotels & Flights Across India</title></Head>
      <Navbar />

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: 580, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Dark gradient background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, #050a18 0%, #0a1628 30%, #0d1f3c 60%, #0a1628 100%)' }} />

        {/* 3D Globe Background */}
        <GlobeScene />

        <div className="container" style={{ position: 'relative', zIndex: 2, paddingTop: 60, paddingBottom: 60, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 36, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-full)', padding: '6px 16px', marginBottom: 16 }}>
              <FiStar size={12} color="#fbbf24" fill="#fbbf24" />
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.78rem', fontWeight: 600 }}>India's #1 Premium Travel Platform</span>
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.8rem)', fontWeight: 800, color: 'white', marginBottom: 14, lineHeight: 1.1 }}>
              Your Journey Begins<br />
              <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f5d580)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Here</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', maxWidth: 520, margin: '0 auto 24px' }}>
              Discover luxury hotels and flights across India. Best prices, guaranteed.
            </p>

            {/* AI Search Bar */}
            <div className="ai-search-container" style={{ maxWidth: 600, margin: '0 auto 8px', display: 'flex', gap: 0, background: 'var(--bg-card)', backdropFilter: 'blur(20px)', borderRadius: 'var(--radius-full)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', paddingLeft: 20, gap: 8, flexShrink: 0 }}>
                <FiZap size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>AI</span>
              </div>
              <input value={aiSearch} onChange={e => setAiSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAISearch()}
                placeholder="Try: 'Beach hotel in Goa under ₹10000'"
                style={{ flex: 1, padding: '16px 20px', border: 'none', outline: 'none', fontSize: '0.88rem', background: 'transparent', color: 'var(--text-primary)' }} />
              <button onClick={handleAISearch} disabled={aiLoading}
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--primary), #0e4fc4)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'var(--transition)', flexShrink: 0 }}>
                {aiLoading ? <span className="loader" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <FiSearch size={16} />}
                <span className="desktop-only">Search</span>
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Powered by Skystay AI • Describe your perfect trip</p>
          </div>

          {/* Search Box */}
          <div className="search-box-container" style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', borderRadius: 'var(--radius-xl)', padding: 'clamp(16px, 3vw, 24px)', maxWidth: 920, margin: '0 auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '1px solid var(--border)', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
              {['Hotels', 'Flights'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 'var(--radius-full)', border: '2px solid', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap',
                    background: tab === t ? 'linear-gradient(135deg, var(--primary), #0e4fc4)' : 'var(--bg)',
                    color: tab === t ? 'white' : 'var(--text-secondary)',
                    borderColor: tab === t ? 'transparent' : 'var(--border)',
                    boxShadow: tab === t ? '0 4px 12px rgba(26,110,245,0.3)' : 'none',
                    transform: tab === t ? 'translateY(-1px)' : 'none' }}>
                  {t === 'Hotels' ? <MdHotel size={16} /> : <MdFlight size={16} />} {t}
                </button>
              ))}
            </div>

            {tab === 'Hotels' ? (
              <div className="search-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, alignItems: 'end' }}>
                <div className="input-group">
                  <label className="input-label">City</label>
                  <select className="input-field" value={hotelForm.city} onChange={e => setHotelForm({ ...hotelForm, city: e.target.value })}>
                    <option value="">Select City</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Check-in</label>
                  <input className="input-field" type="date" min={today} value={hotelForm.checkIn} onChange={e => setHotelForm({ ...hotelForm, checkIn: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Check-out</label>
                  <input className="input-field" type="date" min={hotelForm.checkIn || today} value={hotelForm.checkOut} onChange={e => setHotelForm({ ...hotelForm, checkOut: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Guests</label>
                  <select className="input-field" value={hotelForm.guests} onChange={e => setHotelForm({ ...hotelForm, guests: e.target.value })}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary btn-lg" onClick={searchHotels} style={{ whiteSpace: 'nowrap', width: '100%', height: 48, borderRadius: 'var(--radius-md)' }}>
                  <FiSearch size={18} /> Search
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                  {['oneway', 'roundtrip'].map(t => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                      <input type="radio" value={t} checked={flightForm.tripType === t} onChange={e => setFlightForm({ ...flightForm, tripType: e.target.value })} />
                      {t === 'oneway' ? 'One Way' : 'Round Trip'}
                    </label>
                  ))}
                </div>
                <div className="search-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, alignItems: 'end' }}>
                  <div className="input-group">
                    <label className="input-label">From</label>
                    <select className="input-field" value={flightForm.from} onChange={e => setFlightForm({ ...flightForm, from: e.target.value })}>
                      <option value="">From</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">To</label>
                    <select className="input-field" value={flightForm.to} onChange={e => setFlightForm({ ...flightForm, to: e.target.value })}>
                      <option value="">To</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Date</label>
                    <input className="input-field" type="date" min={today} value={flightForm.date} onChange={e => setFlightForm({ ...flightForm, date: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Passengers</label>
                    <select className="input-field" value={flightForm.passengers} onChange={e => setFlightForm({ ...flightForm, passengers: e.target.value })}>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-accent btn-lg" onClick={searchFlights} style={{ whiteSpace: 'nowrap', width: '100%', height: 48, borderRadius: 'var(--radius-md)' }}>
                    <FiSearch size={18} /> Search
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 640px) {
            .search-grid { grid-template-columns: 1fr !important; }
            .ai-search-container { border-radius: 16px !important; }
            .ai-search-container input { padding: 12px 16px !important; }
          }
        `}} />
      </section>

      {/* AI Trip Planner Banner */}
      <section style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #1a3a6e 100%)', padding: '40px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Floating 3D Airplane */}
        <div className="floating-plane" style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', fontSize: '3rem', opacity: 0.15, pointerEvents: 'none' }}>
          ✈️
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 3s ease-in-out infinite', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <FiZap size={28} color="#fbbf24" />
              </div>
              <div>
                <div style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>✨ AI POWERED</div>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 800, color: 'white', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)' }}>Plan Your Dream Trip with AI</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: 2 }}>Get a personalized luxury itinerary in seconds</p>
              </div>
            </div>
            <button className="btn btn-gold btn-lg" onClick={() => setShowTripPlanner(true)} style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiZap size={18} /> Generate My Trip Plan ✨
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: 'white', padding: '48px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: <MdSecurity size={26} color="var(--primary)" />, title: 'Secure Booking', desc: 'Bank-grade SSL encryption for all transactions.', color: 'var(--primary-light)' },
              { icon: <MdSupportAgent size={26} color="#10b981" />, title: '24/7 AI Support', desc: 'Our AI concierge is available round the clock.', color: '#d1fae5' },
              { icon: <FiStar size={22} color="#f59e0b" />, title: 'Best Price Guarantee', desc: "Find lower? We'll match it. Always.", color: '#fef3c7' }
            ].map((f, i) => (
              <div key={f.title} className="hover-lift" style={{ display: 'flex', gap: 14, padding: 22, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', background: 'white', cursor: 'default', animation: `fadeInUp 0.5s ease ${i * 0.1}s both` }}>
                <div style={{ width: 50, height: 50, background: f.color, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 className="section-title">Featured Hotels</h2>
              <p className="section-subtitle">Handpicked luxury stays across India</p>
            </div>
            <button className="btn btn-outline" onClick={() => router.push('/hotels')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>View All →</button>
          </div>
          {loadingHotels ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 340, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {featuredHotels.map((hotel, i) => (
                <div key={hotel._id} style={{ animation: `fadeInUp 0.5s ease ${i * 0.1}s both` }}>
                  <HotelCard hotel={hotel} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Destinations */}
      <section style={{ background: 'white', padding: '0 0 80px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 className="section-title">Popular Destinations</h2>
              <p className="section-subtitle">Explore India's most loved travel spots</p>
            </div>
            <button className="btn btn-outline" onClick={() => router.push('/hotels')}>View All →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {POPULAR_DESTINATIONS.map((dest, i) => (
              <div key={dest.city} className="tilt-card" onClick={() => router.push(`/hotels?city=${dest.city}`)}
                style={{ position: 'relative', height: 250, borderRadius: 'var(--radius-xl)', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-md)', animation: `fadeInUp 0.5s ease ${i * 0.1}s both`, transition: 'transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 0.4s', transformStyle: 'preserve-3d', perspective: '800px' }}
                onMouseMove={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width - 0.5;
                  const y = (e.clientY - rect.top) / rect.height - 0.5;
                  e.currentTarget.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)`;
                  e.currentTarget.style.boxShadow = `${-x * 20}px ${y * 20}px 40px rgba(0,0,0,0.3)`;
                  // Move glare
                  const glare = e.currentTarget.querySelector('.card-glare');
                  if (glare) { glare.style.opacity = '1'; glare.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.25) 0%, transparent 60%)`; }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  const glare = e.currentTarget.querySelector('.card-glare');
                  if (glare) glare.style.opacity = '0';
                }}>
                <img src={dest.img} alt={dest.city} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
                {/* 3D Glare overlay */}
                <div className="card-glare" style={{ position: 'absolute', inset: 0, opacity: 0, transition: 'opacity 0.3s', pointerEvents: 'none', borderRadius: 'inherit' }} />
                <div style={{ position: 'absolute', bottom: 20, left: 20, color: 'white' }}>
                  <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.2rem' }}>{dest.city}</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: 2 }}>{dest.desc}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>{dest.hotels} Hotels</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {showTripPlanner && <TripPlanner onClose={() => setShowTripPlanner(false)} />}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatPlane {
          0%, 100% { transform: translateY(-50%) rotateZ(-5deg) translateX(0); }
          25% { transform: translateY(-55%) rotateZ(0deg) translateX(10px); }
          50% { transform: translateY(-45%) rotateZ(5deg) translateX(-5px); }
          75% { transform: translateY(-52%) rotateZ(-2deg) translateX(8px); }
        }
        .floating-plane { animation: floatPlane 8s ease-in-out infinite; }
        .tilt-card { will-change: transform; }
        @media (max-width: 640px) { .floating-plane { display: none !important; } }
      `}} />
    </>
  );
}