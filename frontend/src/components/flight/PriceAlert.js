import { useState, useEffect } from 'react';
import { FiBell, FiBellOff, FiTrendingDown, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PriceAlert({ from, to, currentPrice, user }) {
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [targetPrice, setTargetPrice] = useState(Math.round(currentPrice * 0.85));
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  // Load alerts from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('skystay_price_alerts') || '[]');
    setAlerts(stored);
  }, []);

  const activeAlert = alerts.find(a => a.from === from && a.to === to);

  const saveAlert = () => {
    if (!email) { toast.error('Please enter email'); return; }
    if (!targetPrice || targetPrice <= 0) { toast.error('Enter valid target price'); return; }
    setSaving(true);

    const newAlert = {
      id: Date.now(),
      from, to,
      targetPrice: Number(targetPrice),
      currentPrice,
      email,
      createdAt: new Date().toISOString(),
      active: true,
    };

    const stored = JSON.parse(localStorage.getItem('skystay_price_alerts') || '[]');
    const updated = [...stored.filter(a => !(a.from === from && a.to === to)), newAlert];
    localStorage.setItem('skystay_price_alerts', JSON.stringify(updated));
    setAlerts(updated);

    setTimeout(() => {
      setSaving(false);
      setShowForm(false);
      toast.success(`Price alert set! We'll notify you when ${from}→${to} drops below ₹${Number(targetPrice).toLocaleString()}`);
    }, 800);
  };

  const removeAlert = () => {
    const stored = JSON.parse(localStorage.getItem('skystay_price_alerts') || '[]');
    const updated = stored.filter(a => !(a.from === from && a.to === to));
    localStorage.setItem('skystay_price_alerts', JSON.stringify(updated));
    setAlerts(updated);
    toast.success('Price alert removed');
  };

  const savingPercent = currentPrice && targetPrice
    ? Math.round(((currentPrice - targetPrice) / currentPrice) * 100)
    : 0;

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: showForm ? '1px solid var(--border-light)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, background: activeAlert ? '#fef3c7' : '#e8f0fe', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeAlert ? <FiBell size={18} color="#f59e0b" /> : <FiBell size={18} color="#1a6ef5" />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Price Alert</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {activeAlert ? `Alert set for ₹${activeAlert.targetPrice.toLocaleString()}` : 'Get notified when price drops'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeAlert && (
            <button onClick={removeAlert}
              style={{ padding: '6px 12px', borderRadius: 8, background: '#fee2e2', color: '#ef4444', border: 'none', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiBellOff size={13} /> Remove
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '6px 14px', borderRadius: 8, background: activeAlert ? 'var(--border-light)' : 'linear-gradient(135deg, #1a6ef5, #0e4fc4)', color: activeAlert ? 'var(--text-secondary)' : 'white', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            {activeAlert ? 'Edit' : '+ Set Alert'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ padding: '18px', animation: 'fadeInUp 0.25s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Current Price</label>
              <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>₹{currentPrice?.toLocaleString()}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Alert me when below</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-secondary)' }}>₹</span>
                <input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px 10px 24px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.95rem', fontWeight: 700, outline: 'none' }} />
              </div>
            </div>
          </div>

          {savingPercent > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#d1fae5', borderRadius: 8, marginBottom: 14 }}>
              <FiTrendingDown size={16} color="#065f46" />
              <span style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 600 }}>You'll save {savingPercent}% (₹{(currentPrice - targetPrice).toLocaleString()})</span>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Notify via Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.88rem', outline: 'none' }} />
          </div>

          {/* Slider */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quick Select</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {[5, 10, 15, 20, 25].map(pct => (
                <button key={pct} onClick={() => setTargetPrice(Math.round(currentPrice * (1 - pct / 100)))}
                  style={{ padding: '4px 12px', borderRadius: 20, background: 'var(--primary-light)', color: 'var(--primary)', border: '1.5px solid var(--primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  -{pct}%
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveAlert} disabled={saving}
            style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #1a6ef5, #0e4fc4)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9rem' }}>
            {saving
              ? <div className="loader" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
              : <><FiBell size={16} /> Set Price Alert</>
            }
          </button>
        </div>
      )}
    </div>
  );
}
