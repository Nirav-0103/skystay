import { useState, useEffect } from 'react';
import { FiStar, FiTrendingUp, FiGift, FiAward } from 'react-icons/fi';

const TIERS = [
  { name: 'Blue', min: 0, max: 999, color: '#64748b', bg: '#f1f5f9', icon: '🔵', perks: ['1% cashback on bookings', 'Birthday bonus points', 'Member-only deals'] },
  { name: 'Silver', min: 1000, max: 4999, color: '#94a3b8', bg: '#f8fafc', icon: '🥈', perks: ['2% cashback', 'Priority customer support', 'Free seat selection', 'Extra baggage allowance'] },
  { name: 'Gold', min: 5000, max: 14999, color: '#d4af37', bg: '#fdf6e3', icon: '🥇', perks: ['3% cashback', 'Lounge access (2x/month)', 'Complimentary upgrades', 'Flexible cancellation', 'Dedicated support line'] },
  { name: 'Platinum', min: 15000, max: Infinity, color: '#7c3aed', bg: '#f5f3ff', icon: '💎', perks: ['5% cashback', 'Unlimited lounge access', 'Guaranteed upgrades', 'Free date changes', 'Personal travel concierge', 'Priority check-in'] },
];

function getCurrentTier(points) {
  return TIERS.find(t => points >= t.min && points < t.max) || TIERS[0];
}

function getNextTier(points) {
  const idx = TIERS.findIndex(t => points >= t.min && points < t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export default function LoyaltyProgram({ user, compact = false }) {
  const points = user?.skyPoints || 0;
  const tier = getCurrentTier(points);
  const nextTier = getNextTier(points);
  const [activeTab, setActiveTab] = useState('overview');
  const [animated, setAnimated] = useState(false);

  useEffect(() => { setTimeout(() => setAnimated(true), 200); }, []);

  const progress = nextTier
    ? ((points - tier.min) / (nextTier.min - tier.min)) * 100
    : 100;

  const REWARDS = [
    { id: 'r1', label: '₹100 off next booking', points: 500, icon: '🎟️' },
    { id: 'r2', label: 'Free seat upgrade', points: 1000, icon: '💺' },
    { id: 'r3', label: '₹500 hotel voucher', points: 2000, icon: '🏨' },
    { id: 'r4', label: 'Free lounge access', points: 1500, icon: '🥂' },
    { id: 'r5', label: '₹1000 flight voucher', points: 4000, icon: '✈️' },
    { id: 'r6', label: 'Weekend getaway', points: 10000, icon: '🌴' },
  ];

  if (compact) {
    return (
      <div style={{ background: `linear-gradient(135deg, ${tier.color}20, ${tier.bg})`, borderRadius: 14, padding: '14px 18px', border: `1.5px solid ${tier.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>{tier.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: tier.color }}>{tier.name} Member</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{points.toLocaleString()} SkyPoints</div>
          </div>
        </div>
        {nextTier && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Next: {nextTier.name}</div>
            <div style={{ fontSize: '0.72rem', color: tier.color, fontWeight: 700 }}>{(nextTier.min - points).toLocaleString()} pts away</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Header Banner */}
      <div style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}99)`, padding: '24px 24px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: 30, top: 30, width: 60, height: 60, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 4 }}>SKYSTAY REWARDS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: '2rem' }}>{tier.icon}</span>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.4rem' }}>{tier.name} Member</h2>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>{user?.name || 'Traveller'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>Available Points</div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>{points.toLocaleString()}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>SkyPoints</div>
          </div>
        </div>

        {/* Progress Bar */}
        {nextTier && (
          <div style={{ marginTop: 20, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>{tier.name}: {tier.min.toLocaleString()} pts</span>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>{nextTier.name}: {nextTier.min.toLocaleString()} pts</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
              <div style={{ height: '100%', width: `${animated ? progress : 0}%`, background: 'white', borderRadius: 999, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
            <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem', textAlign: 'center' }}>
              {(nextTier.min - points).toLocaleString()} more points to {nextTier.name} {nextTier.icon}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {[{ id: 'overview', label: 'Overview' }, { id: 'perks', label: 'Your Perks' }, { id: 'redeem', label: 'Redeem' }, { id: 'tiers', label: 'All Tiers' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: '12px 8px', border: 'none', background: 'none', fontWeight: activeTab === t.id ? 700 : 500, fontSize: '0.82rem', color: activeTab === t.id ? tier.color : 'var(--text-secondary)', borderBottom: activeTab === t.id ? `2.5px solid ${tier.color}` : '2.5px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        {/* Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { icon: <FiStar size={20} color={tier.color} />, label: 'Total Points', value: points.toLocaleString(), bg: tier.bg },
              { icon: <FiTrendingUp size={20} color="#10b981" />, label: 'Points This Month', value: '+250', bg: '#d1fae5' },
              { icon: <FiGift size={20} color="#f59e0b" />, label: 'Redeemable Value', value: `₹${Math.floor(points / 10)}`, bg: '#fef3c7' },
              { icon: <FiAward size={20} color="#6366f1" />, label: 'Tier Status', value: tier.name, bg: '#eef2ff' },
            ].map(stat => (
              <div key={stat.label} style={{ padding: 16, background: stat.bg, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Perks */}
        {activeTab === 'perks' && (
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>Your {tier.name} membership benefits:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tier.perks.map((perk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: tier.bg, borderRadius: 10, animation: `fadeInUp 0.3s ease ${i * 0.08}s both` }}>
                  <div style={{ width: 22, height: 22, background: tier.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redeem */}
        {activeTab === 'redeem' && (
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>Redeem your SkyPoints for rewards:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {REWARDS.map((r, i) => {
                const canRedeem = points >= r.points;
                return (
                  <div key={r.id} style={{ padding: 14, borderRadius: 12, border: `1.5px solid ${canRedeem ? tier.color : 'var(--border)'}`, background: canRedeem ? tier.bg : 'var(--bg)', opacity: canRedeem ? 1 : 0.6, transition: 'all 0.2s', animation: `fadeInUp 0.3s ease ${i * 0.06}s both` }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{r.icon}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontSize: '0.75rem', color: tier.color, fontWeight: 700 }}>{r.points.toLocaleString()} pts</div>
                    {canRedeem && (
                      <button style={{ marginTop: 10, width: '100%', padding: '6px', borderRadius: 8, background: tier.color, color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                        Redeem
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tiers */}
        {activeTab === 'tiers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TIERS.map((t, i) => {
              const isCurrentTier = t.name === tier.name;
              const isAchieved = points >= t.min;
              return (
                <div key={t.name} style={{ padding: '14px 18px', borderRadius: 12, border: `2px solid ${isCurrentTier ? t.color : 'var(--border)'}`, background: isCurrentTier ? t.bg : 'white', transition: 'all 0.2s', animation: `fadeInUp 0.3s ease ${i * 0.08}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isCurrentTier ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.4rem' }}>{t.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: t.color }}>{t.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.min.toLocaleString()}+ points</div>
                      </div>
                    </div>
                    {isCurrentTier && <span style={{ background: t.color, color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>CURRENT</span>}
                    {isAchieved && !isCurrentTier && <span style={{ color: t.color, fontSize: '0.78rem', fontWeight: 700 }}>✓ Achieved</span>}
                  </div>
                  {isCurrentTier && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {t.perks.slice(0, 3).map(p => (
                        <span key={p} style={{ fontSize: '0.7rem', background: 'white', color: t.color, padding: '2px 8px', borderRadius: 6, border: `1px solid ${t.color}30` }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
