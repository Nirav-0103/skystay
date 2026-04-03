import { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { aiAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { FiMapPin, FiCalendar, FiDollarSign, FiUsers, FiHeart, FiZap, FiArrowRight, FiInfo, FiCheckCircle } from 'react-icons/fi';

const INTERESTS = ['Sightseeing', 'Food & Dining', 'Culture', 'Shopping', 'Adventure', 'Relaxation', 'Nightlife', 'Religious'];

export default function AITripPlanner() {
  const [form, setForm] = useState({
    destination: '',
    days: 3,
    budget: 50000,
    travelers: 2,
    interests: [],
    startFrom: ''
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const toggleInterest = (interest) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.destination) return toast.error('Please enter a destination');
    
    setLoading(true);
    setPlan(null);
    try {
      const res = await aiAPI.tripPlanner(form);
      if (res.data.success) {
        setPlan(res.data.plan);
        toast.success('Your custom itinerary is ready! ✨');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI is currently busy, please try again later');
    }
    setLoading(false);
  };

  return (
    <>
      <Head><title>Smart AI Trip Planner - SkyStay</title></Head>
      <Navbar />
      
      <div className="page-header" style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #1a3a6e 60%, #1a6ef5 100%)', padding: '80px 0', color: 'white', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 700, marginBottom: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
            <FiZap color="#fbbf24" fill="#fbbf24" /> POWERED BY SKYAI
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, fontFamily: 'Syne', marginBottom: 16, lineHeight: 1.1 }}>Smart AI Trip Planner</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, fontWeight: 500 }}>Tell us your dream, and we'll build the perfect itinerary in seconds.</p>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 20px 100px', marginTop: -60 }}>
        <div style={{ display: 'grid', gridTemplateColumns: plan ? '380px 1fr' : '1fr', gap: 40, alignItems: 'start' }}>
          
          {/* Form Card */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '40px 32px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)', position: 'sticky', top: 100 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiZap color="var(--primary)" /> Build My Trip
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Where to?</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-field" type="text" placeholder="e.g. Goa, Paris, Tokyo" value={form.destination}
                    onChange={e => setForm({ ...form, destination: e.target.value })} required style={{ paddingLeft: 44 }} />
                  <FiMapPin style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="input-group">
                  <label className="input-label">Days</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input-field" type="number" min="1" max="14" value={form.days}
                      onChange={e => setForm({ ...form, days: Number(e.target.value) })} style={{ paddingLeft: 44 }} />
                    <FiCalendar style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Travelers</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input-field" type="number" min="1" max="10" value={form.travelers}
                      onChange={e => setForm({ ...form, travelers: Number(e.target.value) })} style={{ paddingLeft: 44 }} />
                    <FiUsers style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 20 }}>
                <label className="input-label">Total Budget (₹)</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-field" type="number" step="5000" value={form.budget}
                    onChange={e => setForm({ ...form, budget: Number(e.target.value) })} style={{ paddingLeft: 44 }} />
                  <FiDollarSign style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="input-label" style={{ marginBottom: 12, display: 'block' }}>Interests</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INTERESTS.map(interest => (
                    <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                      style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600, border: '1.5px solid ' + (form.interests.includes(interest) ? 'var(--primary)' : 'var(--border)'), background: form.interests.includes(interest) ? 'var(--primary-light)' : 'transparent', color: form.interests.includes(interest) ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }} disabled={loading}>
                {loading ? <><span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }} /> Generating Plan...</> : <><FiZap fill="white" /> Generate Itinerary</>}
              </button>
            </form>
          </div>

          {/* Plan Display */}
          <div style={{ minHeight: 400 }}>
            {!plan && !loading && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border)', padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: 24, opacity: 0.3 }}>🗺️</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>Your Itinerary Awaits</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>Fill out the form on the left to generate a personalized day-by-day travel plan.</p>
              </div>
            )}

            {loading && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 100 }}>
                <div className="loader" style={{ width: 50, height: 50, borderWidth: 4, marginBottom: 24 }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>SkyBot is thinking...</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Curating the best experiences in {form.destination}</p>
              </div>
            )}

            {plan && (
              <div style={{ animation: 'fadeInUp 0.5s ease' }}>
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '40px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 20 }}>
                    <div>
                      <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{plan.title}</h1>
                      <p style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 600 }}>✨ {plan.tagline}</p>
                    </div>
                    <div style={{ background: 'var(--bg)', padding: '12px 20px', borderRadius: 'var(--radius-lg)', textAlign: 'right', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Best Time to Visit</div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{plan.bestTime}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 40 }}>
                    {plan.highlights.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
                        <FiCheckCircle color="var(--success)" size={16} /> {h}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                    {plan.days.map((day, i) => (
                      <div key={i} style={{ position: 'relative', paddingLeft: 40, borderLeft: '2px solid var(--border-light)' }}>
                        <div style={{ position: 'absolute', left: -16, top: 0, width: 32, height: 32, background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(26,110,245,0.3)' }}>
                          {day.day}
                        </div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-primary)' }}>{day.title}</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                          {[
                            { label: 'Morning', text: day.morning, icon: '🌅' },
                            { label: 'Afternoon', text: day.afternoon, icon: '☀️' },
                            { label: 'Evening', text: day.evening, icon: '🌃' }
                          ].map(part => (
                            <div key={part.label}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {part.icon} {part.label}
                              </div>
                              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{part.text}</p>
                            </div>
                          ))}
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ background: 'var(--primary-light)', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                            🏨 {day.hotel}
                          </div>
                          <div style={{ background: '#fdf6e3', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#856404', fontWeight: 600 }}>
                            🍱 {day.food}
                          </div>
                          <div style={{ background: '#e1f5fe', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#01579b', fontWeight: 600 }}>
                            💡 {day.tip}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Costs & Tips */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '32px', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FiDollarSign color="var(--success)" /> Budget Estimate
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {Object.entries(plan.estimatedCost).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                          <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontWeight: 600 }}>{key}</span>
                          <span style={{ fontWeight: 800 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '32px', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FiInfo color="var(--primary)" /> Packing Tips
                    </h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {plan.packingTips.map((tip, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                          <FiArrowRight size={14} color="var(--primary)" /> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
