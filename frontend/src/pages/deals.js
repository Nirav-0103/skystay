import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useCurrency } from '../context/CurrencyContext';
import { FiTag, FiClock } from 'react-icons/fi';

const DEALS = [
  { title: 'Summer Escape to Goa', discount: '30%', original: '18000', discounted: '12600', type: 'Hotel', validity: 'Till Mar 31', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600', code: 'GOASUMMER', badge: '🔥 Hot Deal' },
  { title: 'Delhi to Mumbai Flights', discount: '25%', original: '6500', discounted: '4875', type: 'Flight', validity: 'Till Apr 15', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600', code: 'FLYINDIA25', badge: '✈️ Flash Sale' },
  { title: 'Luxury Weekend in Udaipur', discount: '20%', original: '45000', discounted: '36000', type: 'Hotel', validity: 'Till Mar 28', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600', code: 'ROYALWEEK', badge: '👑 Premium' },
  { title: 'Bangalore Staycation', discount: '15%', original: '9000', discounted: '7650', type: 'Hotel', validity: 'Till Apr 30', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600', code: 'BLRSTAY15', badge: '🏙️ City Deal' },
  { title: 'Mumbai-Delhi Round Trip', discount: '35%', original: '12000', discounted: '7800', type: 'Flight', validity: 'Till Mar 25', img: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600', code: 'RTDEAL35', badge: '⚡ Best Value' },
  { title: 'Jaipur Heritage Hotel', discount: '22%', original: '22000', discounted: '17160', type: 'Hotel', validity: 'Till Apr 10', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600', code: 'PINKCITY22', badge: '🏰 Heritage' },
];

export default function DealsPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [copied, setCopied] = useState(null);
  const copyCode = (code) => { navigator.clipboard?.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 2000); };

  return (
    <>
      <Head><title>Deals & Offers - SkyStay</title></Head>
      <Navbar />
      <div className="page-header">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: 8 }}>Exclusive Deals 🎁</h1>
          <p style={{ opacity: 0.8 }}>Save big on hotels and flights across India</p>
        </div>
      </div>
      <div className="container" style={{ padding: '40px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 24 }}>
          {DEALS.map((deal, i) => (
            <div key={i} className="card" style={{ animation: `fadeInUp 0.5s ease ${i * 0.08}s both` }}>
              <div style={{ position: 'relative', height: 180, overflow: 'hidden' }} className="img-hover">
                <img src={deal.img} alt={deal.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.4), transparent)' }} />
                <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700 }}>{deal.badge}</span>
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', borderRadius: 'var(--radius-full)', padding: '6px 14px', fontWeight: 800, fontSize: '1rem' }}>-{deal.discount}</div>
              </div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{deal.title}</h3>
                  <span className={`badge ${deal.type === 'Hotel' ? 'badge-blue' : 'badge-green'}`}>{deal.type}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatPrice(deal.original)}</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--success)' }}>{formatPrice(deal.discounted)}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiClock size={12} /> Valid {deal.validity}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1.5px dashed var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => copyCode(deal.code)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <FiTag size={13} color="var(--primary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)' }}>{deal.code}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: copied === deal.code ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {copied === deal.code ? '✓ Copied!' : 'Copy'}
                    </span>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => router.push(deal.type === 'Hotel' ? '/hotels' : '/flights')}>Book →</button>
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