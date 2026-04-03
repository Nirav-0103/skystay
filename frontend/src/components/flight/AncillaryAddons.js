import { useState } from 'react';
import { FiCheck, FiPlus, FiMinus } from 'react-icons/fi';

const ADDONS = [
  {
    category: 'Baggage',
    icon: '🧳',
    color: '#6366f1',
    bg: '#eef2ff',
    items: [
      { id: 'bag15', label: '15 kg Extra Baggage', price: 599, desc: 'Checked baggage', per: '/bag' },
      { id: 'bag25', label: '25 kg Extra Baggage', price: 999, desc: 'Checked baggage', per: '/bag' },
      { id: 'cabin7', label: '7 kg Cabin Bag', price: 349, desc: 'Carry-on upgrade', per: '/trip' },
    ]
  },
  {
    category: 'Meals',
    icon: '🍽️',
    color: '#f59e0b',
    bg: '#fef3c7',
    items: [
      { id: 'veg', label: 'Vegetarian Meal', price: 249, desc: 'VGML - Hot veg meal', per: '/person' },
      { id: 'nonveg', label: 'Non-Veg Meal', price: 299, desc: 'Hot non-vegetarian', per: '/person' },
      { id: 'jain', label: 'Jain Meal', price: 249, desc: 'JNML - Jain diet', per: '/person' },
      { id: 'snack', label: 'Snack Box', price: 149, desc: 'Light refreshments', per: '/person' },
    ]
  },
  {
    category: 'Comfort',
    icon: '✨',
    color: '#10b981',
    bg: '#d1fae5',
    items: [
      { id: 'priority', label: 'Priority Boarding', price: 199, desc: 'Board first, no queue', per: '/trip' },
      { id: 'lounge', label: 'Airport Lounge Access', price: 899, desc: 'Relax before flight', per: '/person' },
      { id: 'flexi', label: 'Flexi Change', price: 499, desc: 'Change date once free', per: '/booking' },
    ]
  },
  {
    category: 'Insurance',
    icon: '🛡️',
    color: '#ef4444',
    bg: '#fee2e2',
    items: [
      { id: 'travel_ins', label: 'Travel Insurance', price: 149, desc: 'Trip cancellation cover', per: '/person' },
      { id: 'covid_ins', label: 'COVID Cover', price: 99, desc: 'Medical expenses covered', per: '/person' },
      { id: 'full_ins', label: 'Full Protection', price: 299, desc: 'All-in-one coverage', per: '/person', recommended: true },
    ]
  }
];

export default function AncillaryAddons({ passengers = 1, onAddonsChange }) {
  const [selected, setSelected] = useState({});
  const [expanded, setExpanded] = useState({ Baggage: true, Meals: false, Comfort: false, Insurance: false });

  const toggle = (item) => {
    setSelected(prev => {
      const updated = { ...prev };
      if (updated[item.id]) {
        delete updated[item.id];
      } else {
        updated[item.id] = item;
      }
      if (onAddonsChange) {
        onAddonsChange(Object.values(updated));
      }
      return updated;
    });
  };

  const totalAddons = Object.values(selected).reduce((sum, item) => {
    const multiplier = item.per === '/person' ? passengers : 1;
    return sum + (item.price * multiplier);
  }, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Add-ons & Services</h3>
        {totalAddons > 0 && (
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>
            +₹{totalAddons.toLocaleString()} added
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ADDONS.map(cat => (
          <div key={cat.category} style={{ background: 'white', borderRadius: 14, border: '1.5px solid var(--border)', overflow: 'hidden', transition: 'all 0.3s' }}>
            {/* Category Header */}
            <button onClick={() => setExpanded(prev => ({ ...prev, [cat.category]: !prev[cat.category] }))}
              style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = cat.bg}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, background: cat.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  {cat.icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{cat.category}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {Object.values(selected).filter(s => cat.items.find(i => i.id === s.id)).length > 0
                      ? `${Object.values(selected).filter(s => cat.items.find(i => i.id === s.id)).length} selected`
                      : `${cat.items.length} options`}
                  </div>
                </div>
              </div>
              <div style={{ transform: expanded[cat.category] ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.25s', color: cat.color, fontSize: '1.2rem', fontWeight: 300 }}>+</div>
            </button>

            {/* Items */}
            {expanded[cat.category] && (
              <div style={{ padding: '4px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeInUp 0.2s ease' }}>
                {cat.items.map(item => {
                  const isSelected = !!selected[item.id];
                  const actualPrice = item.price * (item.per === '/person' ? passengers : 1);
                  return (
                    <div key={item.id} onClick={() => toggle(item)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `2px solid ${isSelected ? cat.color : 'var(--border-light)'}`, background: isSelected ? cat.bg : 'var(--bg)', cursor: 'pointer', transition: 'all 0.2s', transform: isSelected ? 'scale(1.01)' : 'scale(1)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isSelected ? cat.color : 'white', border: `2px solid ${isSelected ? cat.color : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                        {isSelected && <FiCheck size={14} color="white" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.label}</span>
                          {item.recommended && <span style={{ background: '#10b981', color: 'white', padding: '1px 7px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 700 }}>POPULAR</span>}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 1 }}>{item.desc}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, color: isSelected ? cat.color : 'var(--text-primary)', fontSize: '0.92rem' }}>+₹{actualPrice.toLocaleString()}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.per}{item.per === '/person' && passengers > 1 ? ` × ${passengers}` : ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      {totalAddons > 0 && (
        <div style={{ marginTop: 16, padding: '14px 18px', background: 'linear-gradient(135deg, var(--primary-light), #e0ecff)', borderRadius: 12, border: '1.5px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Add-ons Total</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {Object.values(selected).map(s => s.label).join(', ')}
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>+₹{totalAddons.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
