import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { FiMapPin, FiStar, FiSun, FiCloud } from 'react-icons/fi';

const DESTINATIONS = [
  { city: 'Mumbai', state: 'Maharashtra', hotels: '120+', flights: '50+', desc: 'The city that never sleeps. Gateway of India, Bollywood, street food & iconic skyline.', img: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800', highlights: ['Gateway of India', 'Marine Drive', 'Juhu Beach', 'Dharavi'], bestTime: 'Oct-Mar', rating: 4.8, badge: '🏆 Most Popular' },
  { city: 'Delhi', state: 'NCT', hotels: '95+', flights: '60+', desc: 'India\'s capital blends ancient monuments with modern infrastructure and diverse cuisine.', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800', highlights: ['Red Fort', 'Qutub Minar', 'India Gate', 'Chandni Chowk'], bestTime: 'Oct-Mar', rating: 4.7, badge: '🏛️ Heritage' },
  { city: 'Goa', state: 'Goa', hotels: '85+', flights: '30+', desc: 'Sun, sand, and surf. India\'s beach paradise with Portuguese heritage and vibrant nightlife.', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800', highlights: ['Calangute Beach', 'Old Goa Church', 'Dudhsagar Falls', 'Anjuna Market'], bestTime: 'Nov-Feb', rating: 4.9, badge: '🏖️ Beach Paradise' },
  { city: 'Jaipur', state: 'Rajasthan', hotels: '70+', flights: '25+', desc: 'The Pink City dazzles with magnificent palaces, forts, and vibrant bazaars.', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800', highlights: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Nahargarh Fort'], bestTime: 'Oct-Mar', rating: 4.8, badge: '🏰 Royal Heritage' },
  { city: 'Udaipur', state: 'Rajasthan', hotels: '60+', flights: '15+', desc: 'The City of Lakes — romantic, regal, and utterly breathtaking with lakeside palaces.', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800', highlights: ['Lake Pichola', 'City Palace', 'Jag Mandir', 'Fateh Sagar'], bestTime: 'Sep-Mar', rating: 4.9, badge: '💎 Most Romantic' },
  { city: 'Bangalore', state: 'Karnataka', hotels: '80+', flights: '55+', desc: 'Silicon Valley of India with a perfect climate, craft breweries, and tech energy.', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800', highlights: ['Lalbagh', 'Cubbon Park', 'MG Road', 'ISKCON Temple'], bestTime: 'Year Round', rating: 4.6, badge: '💻 Tech Hub' },
  { city: 'Chennai', state: 'Tamil Nadu', hotels: '65+', flights: '35+', desc: 'Cultural capital of South India with classical arts, temples, and pristine beaches.', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800', highlights: ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George', 'T Nagar Shopping'], bestTime: 'Nov-Feb', rating: 4.5, badge: '🎭 Cultural Hub' },
  { city: 'Kolkata', state: 'West Bengal', hotels: '55+', flights: '30+', desc: 'City of Joy — literary culture, colonial architecture, and the most passionate food scene.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', highlights: ['Victoria Memorial', 'Howrah Bridge', 'Durga Puja', 'Park Street'], bestTime: 'Oct-Mar', rating: 4.6, badge: '🎨 Cultural Capital' },
  { city: 'Hyderabad', state: 'Telangana', hotels: '70+', flights: '40+', desc: 'City of Pearls — the iconic biryani, Charminar, and a booming tech ecosystem.', img: 'https://images.unsplash.com/photo-1573483977249-cbdc8ab2e0df?w=800', highlights: ['Charminar', 'Golconda Fort', 'Hussain Sagar', 'Ramoji Film City'], bestTime: 'Oct-Feb', rating: 4.7, badge: '🍚 Food Heaven' },
  { city: 'Pune', state: 'Maharashtra', hotels: '50+', flights: '25+', desc: 'Oxford of the East — vibrant youth culture, weekend getaways, and pleasant weather.', img: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800', highlights: ['Shaniwar Wada', 'Aga Khan Palace', 'Koregaon Park', 'Sinhagad Fort'], bestTime: 'Oct-Feb', rating: 4.5, badge: '🎓 Student Hub' },
  { city: 'Agra', state: 'Uttar Pradesh', hotels: '40+', flights: '10+', desc: 'Home to the iconic Taj Mahal — one of the Seven Wonders of the World.', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800', highlights: ['Taj Mahal', 'Agra Fort', 'Fatehpur Sikri', 'Mehtab Bagh'], bestTime: 'Oct-Mar', rating: 4.9, badge: '🕌 Wonder of World' },
  { city: 'Varanasi', state: 'Uttar Pradesh', hotels: '35+', flights: '12+', desc: 'The spiritual capital of India — ghats, Ganga Aarti, and timeless mysticism.', img: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800', highlights: ['Dashashwamedh Ghat', 'Kashi Vishwanath', 'Sarnath', 'Boat Rides'], bestTime: 'Oct-Mar', rating: 4.8, badge: '🕉️ Spiritual Hub' },
];

export default function DestinationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const filtered = DESTINATIONS.filter(d => d.city.toLowerCase().includes(search.toLowerCase()) || d.state.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Head><title>Popular Destinations - SkyStay</title></Head>
      <Navbar />
      <div className="page-header">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: 8 }}>Popular Destinations ✈️</h1>
          <p style={{ opacity: 0.8, fontSize: '1rem', marginBottom: 24 }}>Explore India's most incredible travel spots</p>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search destinations..."
            style={{ padding: '12px 20px', borderRadius: 'var(--radius-full)', border: 'none', fontSize: '0.95rem', width: 'min(400px, 100%)', outline: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filtered.map((dest, i) => (
            <div key={dest.city} className="card" style={{ animation: `fadeInUp 0.5s ease ${i * 0.05}s both`, overflow: 'hidden' }}>
              <div className="img-hover" style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                <img src={dest.img} alt={dest.city} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dest.badge}</span>
                <span className="rating" style={{ position: 'absolute', top: 12, right: 12, fontSize: '0.75rem' }}>⭐ {dest.rating}</span>
              </div>
              <div style={{ padding: '18px 20px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.1rem' }}>{dest.city}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{dest.state}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.6, marginBottom: 14 }}>{dest.desc}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {dest.highlights.slice(0,3).map(h => <span key={h} className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{h}</span>)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  <span>🏨 {dest.hotels} Hotels</span>
                  <span>✈️ {dest.flights} Flights</span>
                  <span>🌤️ Best: {dest.bestTime}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => router.push(`/flights?to=${dest.city}`)}>Book Flight</button>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => router.push(`/hotels?city=${dest.city}`)}>Find Hotels</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}


