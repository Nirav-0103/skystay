import { useState } from 'react';
import { FiX, FiZap, FiMapPin, FiCalendar, FiUsers, FiDollarSign } from 'react-icons/fi';

const API_URL = "/api" || 'http://localhost:10000/api';
const CITIES = ['Mumbai','Delhi','Goa','Jaipur','Udaipur','Bangalore','Chennai','Kolkata','Hyderabad','Pune','Agra','Varanasi','Kerala','Shimla','Manali'];
const INTERESTS = ['Beach','Culture','Adventure','Luxury','Food','Spiritual','Wildlife','Shopping','Honeymoon','Family','Trekking','Photography'];

export default function TripPlanner({ onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ destination: '', days: '3', budget: '25000', travelers: '2', interests: [], startFrom: '' });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (i) => setForm(f => ({ ...f, interests: f.interests.includes(i) ? f.interests.filter(x=>x!==i) : [...f.interests, i] }));

  const generatePlan = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/ai/trip-planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
        setStep(3);
      } else {
        setError(data.message || 'Failed to generate plan. Try again!');
      }
    } catch {
      setError('Connection error. Please try again!');
    }
    setLoading(false);
  };

  const inputStyle = { padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.92rem', width: '100%', fontFamily: 'inherit', outline: 'none', transition: 'var(--transition)', background: 'var(--bg)' };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()} style={{ alignItems: 'flex-start', paddingTop: 30, overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 660, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.2)', animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0d1b2e, #1a3a6e, #1a6ef5)', padding: '24px 28px', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FiZap size={16} color="#fbbf24" />
                <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>POWERED BY SKYSTAY</span>
              </div>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.5rem', color: 'white' }}>AI Trip Planner ✨</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: 4 }}>Personalized luxury itinerary in seconds</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <FiX size={18} />
            </button>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, position: 'relative', zIndex: 1 }}>
            {['Destination','Preferences','Your Plan'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: step > i+1 ? '#4ade80' : step === i+1 ? 'white' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: step === i+1 ? 'var(--primary)' : step > i+1 ? '#0d1b2e' : 'rgba(255,255,255,0.5)', transition: 'var(--transition)' }}>
                  {step > i+1 ? '✓' : i+1}
                </div>
                <span style={{ color: step===i+1 ? 'white' : 'rgba(255,255,255,0.45)', fontSize: '0.78rem', fontWeight: step===i+1 ? 700 : 400 }}>{s}</span>
                {i < 2 && <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.2)' }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>

          {/* Step 1 - Destination */}
          {step === 1 && (
            <div style={{ animation: 'fadeInUp 0.4s ease' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 18 }}>Where do you want to go? 🗺️</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Destination *</label>
                  <select style={inputStyle} value={form.destination} onChange={e => setForm({...form, destination: e.target.value})}>
                    <option value="">Select destination</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Starting From</label>
                  <select style={inputStyle} value={form.startFrom} onChange={e => setForm({...form, startFrom: e.target.value})}>
                    <option value="">Select city (optional)</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Number of Days</label>
                  <select style={inputStyle} value={form.days} onChange={e => setForm({...form, days: e.target.value})}>
                    {['2','3','4','5','7','10','14'].map(d => <option key={d} value={d}>{d} Days</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Travelers</label>
                  <select style={inputStyle} value={form.travelers} onChange={e => setForm({...form, travelers: e.target.value})}>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(t => <option key={t} value={t}>{t} {t===1?'Person':'People'}</option>)}
                    <option value="30+">30+ People</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Total Budget (₹)</label>
                  <select style={inputStyle} value={form.budget} onChange={e => setForm({...form, budget: e.target.value})}>
                    <option value="10000">Under ₹10,000</option>
                    <option value="25000">₹25,000</option>
                    <option value="50000">₹50,000</option>
                    <option value="100000">₹1,00,000</option>
                    <option value="200000">₹2,00,000+</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => form.destination && setStep(2)} disabled={!form.destination}>
                Next: Set Preferences →
              </button>
            </div>
          )}

          {/* Step 2 - Preferences */}
          {step === 2 && (
            <div style={{ animation: 'fadeInUp 0.4s ease' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 6 }}>What are your interests? ✨</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 18 }}>Select all that apply (optional)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
                {INTERESTS.map(interest => (
                  <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                    style={{ padding: '9px 18px', borderRadius: 'var(--radius-full)', border: '2px solid', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', transition: 'var(--transition)',
                      background: form.interests.includes(interest) ? 'var(--primary)' : 'white',
                      color: form.interests.includes(interest) ? 'white' : 'var(--text-secondary)',
                      borderColor: form.interests.includes(interest) ? 'var(--primary)' : 'var(--border)',
                      transform: form.interests.includes(interest) ? 'scale(1.05)' : 'scale(1)' }}>
                    {interest}
                  </button>
                ))}
              </div>
              {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: 16 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                <button onClick={generatePlan} disabled={loading}
                  style={{ flex: 2, padding: '14px 24px', borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, #d4af37, #f5d580)', color: '#2a1f00', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(212,175,55,0.4)', transition: 'var(--transition)' }}>
                  {loading ? (
                    <><span className="loader" style={{ width: 20, height: 20, borderWidth: 2, borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#2a1f00' }} /> Generating...</>
                  ) : (
                    <><FiZap size={18} /> Generate My Trip Plan ✨</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Plan */}
          {step === 3 && plan && (
            <div style={{ animation: 'fadeInUp 0.4s ease' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--bg), var(--primary-light))', borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 20, border: '1px solid rgba(26,110,245,0.1)' }}>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.15rem', marginBottom: 4 }}>{plan.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 10 }}>{plan.tagline}</p>
                {plan.highlights?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {plan.highlights.map((h, i) => <span key={i} className="badge badge-blue">✨ {h}</span>)}
                  </div>
                )}
              </div>

              {plan.days?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.95rem' }}>📅 Day-by-Day Itinerary</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.days.map((day, i) => (
                      <div key={i} style={{ padding: 16, background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none'; }}>
                        <div style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: 8, fontSize: '0.9rem' }}>Day {day.day}: {day.title}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {day.morning && <div>🌅 <strong>Morning:</strong> {day.morning}</div>}
                          {day.afternoon && <div>☀️ <strong>Afternoon:</strong> {day.afternoon}</div>}
                          {day.evening && <div>🌙 <strong>Evening:</strong> {day.evening}</div>}
                          {day.food && <div>🍽️ <strong>Must Try:</strong> {day.food}</div>}
                          {day.hotel && <div style={{ marginTop: 6, padding: '5px 10px', background: 'var(--primary-light)', borderRadius: 8 }}>🏨 {day.hotel}</div>}
                          {day.tip && <div style={{ marginTop: 4, color: 'var(--accent)', fontStyle: 'italic' }}>💡 {day.tip}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.estimatedCost && (
                <div style={{ background: 'var(--gold-light)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 14, border: '1px solid rgba(212,175,55,0.2)' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.88rem', color: '#9a7200' }}>💰 Estimated Costs</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {Object.entries(plan.estimatedCost).map(([k, v]) => (
                      <div key={k} style={{ fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}: </span>
                        <strong style={{ color: '#9a7200' }}>{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.bestTime && <div style={{ marginBottom: 14, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>🗓️ <strong>Best time:</strong> {plan.bestTime}</div>}

              {plan.packingTips?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 8 }}>🎒 Packing Tips</div>
                  {plan.packingTips.map((t, i) => <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>• {t}</div>)}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={() => { setStep(1); setPlan(null); }} style={{ flex: 1 }}>← Plan Again</button>
                <button className="btn btn-primary" onClick={onClose} style={{ flex: 1 }}>Book Now →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}