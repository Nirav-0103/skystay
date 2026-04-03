import { useState } from 'react';
import { FiCheck } from 'react-icons/fi';

const ASSISTANCE_OPTIONS = [
  {
    category: 'Mobility Assistance',
    icon: '♿',
    color: '#6366f1',
    bg: '#eef2ff',
    items: [
      { code: 'WCHR', label: 'Wheelchair - Ramp', desc: 'Needs wheelchair to/from aircraft, can walk up stairs' },
      { code: 'WCHS', label: 'Wheelchair - Steps', desc: 'Needs wheelchair and cannot walk up stairs' },
      { code: 'WCHC', label: 'Wheelchair - Cabin', desc: 'Completely immobile, needs full assistance' },
    ]
  },
  {
    category: 'Special Meals',
    icon: '🍽️',
    color: '#f59e0b',
    bg: '#fef3c7',
    items: [
      { code: 'VGML', label: 'Vegetarian', desc: 'Lacto-ovo vegetarian meal' },
      { code: 'VJML', label: 'Vegan', desc: 'Strict vegan meal - no animal products' },
      { code: 'JNML', label: 'Jain Meal', desc: 'Jain diet - no root vegetables' },
      { code: 'KSML', label: 'Kosher Meal', desc: 'Certified Kosher preparation' },
      { code: 'HNML', label: 'Hindu Meal', desc: 'No beef, may include poultry/fish' },
      { code: 'MOML', label: 'Muslim Meal', desc: 'Halal certified meal' },
      { code: 'DBML', label: 'Diabetic Meal', desc: 'Low sugar, controlled carbohydrate' },
      { code: 'LFML', label: 'Low Fat Meal', desc: 'Low fat, low cholesterol meal' },
      { code: 'BLML', label: 'Bland Meal', desc: 'Easily digestible, low spice' },
      { code: 'CHML', label: "Children's Meal", desc: 'Kid-friendly portion and menu' },
    ]
  },
  {
    category: 'Child Services',
    icon: '👶',
    color: '#10b981',
    bg: '#d1fae5',
    items: [
      { code: 'UMNR', label: 'Unaccompanied Minor', desc: 'Child travelling alone (5-11 years) - supervised service' },
      { code: 'INFT', label: 'Infant in Lap', desc: 'Infant under 2 years, seated on adult lap' },
      { code: 'BSCT', label: 'Bassinet/Cot', desc: 'Request a bassinet for infant' },
    ]
  },
  {
    category: 'Medical',
    icon: '🏥',
    color: '#ef4444',
    bg: '#fee2e2',
    items: [
      { code: 'MEDA', label: 'Medical Clearance', desc: 'Passenger with medical condition requiring clearance' },
      { code: 'OXYG', label: 'Oxygen Required', desc: 'In-flight medical oxygen needed' },
      { code: 'STCR', label: 'Stretcher', desc: 'Passenger cannot sit, requires stretcher' },
    ]
  },
  {
    category: 'Other',
    icon: '✨',
    color: '#64748b',
    bg: '#f1f5f9',
    items: [
      { code: 'DEAF', label: 'Deaf/Hearing Impaired', desc: 'Requires visual announcements and assistance' },
      { code: 'BLND', label: 'Blind/Visually Impaired', desc: 'Requires audio assistance and escort' },
      { code: 'PETC', label: 'Pet in Cabin', desc: 'Travelling with small pet in cabin' },
    ]
  }
];

export default function SpecialAssistance({ passengers = 1, onAssistanceChange }) {
  const [selected, setSelected] = useState({});
  const [expanded, setExpanded] = useState({ 'Mobility Assistance': true });
  const [passengerIdx, setPassengerIdx] = useState(0);

  const toggleItem = (code, item) => {
    setSelected(prev => {
      const key = `${passengerIdx}-${code}`;
      const updated = { ...prev };
      if (updated[key]) delete updated[key];
      else updated[key] = { ...item, passengerIndex: passengerIdx };
      if (onAssistanceChange) onAssistanceChange(Object.values(updated));
      return updated;
    });
  };

  const isSelected = (code) => !!selected[`${passengerIdx}-${code}`];

  const totalSelected = Object.keys(selected).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Special Assistance</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Optional services for comfort & accessibility</p>
        </div>
        {totalSelected > 0 && (
          <div style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
            {totalSelected} selected
          </div>
        )}
      </div>

      {/* Passenger Tabs */}
      {passengers > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[...Array(passengers)].map((_, i) => (
            <button key={i} onClick={() => setPassengerIdx(i)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${passengerIdx === i ? '#1a6ef5' : 'var(--border)'}`, background: passengerIdx === i ? 'var(--primary-light)' : 'white', color: passengerIdx === i ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Passenger {i + 1}
              {Object.keys(selected).some(k => k.startsWith(`${i}-`)) && ' ✓'}
            </button>
          ))}
        </div>
      )}

      {/* Assistance Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ASSISTANCE_OPTIONS.map(cat => (
          <div key={cat.category} style={{ borderRadius: 12, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => setExpanded(prev => ({ ...prev, [cat.category]: !prev[cat.category] }))}
              style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, background: cat.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{cat.icon}</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{cat.category}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cat.items.length} options</div>
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', display: 'inline-block', transform: expanded[cat.category] ? 'rotate(180deg)' : 'none' }}>▼</span>
            </button>

            {expanded[cat.category] && (
              <div style={{ padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg)', borderTop: '1px solid var(--border-light)', animation: 'fadeInUp 0.2s ease' }}>
                {cat.items.map(item => {
                  const sel = isSelected(item.code);
                  return (
                    <div key={item.code} onClick={() => toggleItem(item.code, item)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: sel ? cat.bg : 'white', border: `1.5px solid ${sel ? cat.color : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${sel ? cat.color : 'var(--border)'}`, background: sel ? cat.color : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                        {sel && <FiCheck size={12} color="white" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          <span style={{ color: cat.color, fontFamily: 'monospace', marginRight: 6 }}>[{item.code}]</span>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalSelected > 0 && (
        <div style={{ marginTop: 14, padding: '12px 16px', background: '#d1fae5', borderRadius: 10, fontSize: '0.82rem', color: '#065f46' }}>
          <strong>✓ {totalSelected} assistance requests added.</strong> Our team will be notified and arrangements made before your flight.
        </div>
      )}
    </div>
  );
}
