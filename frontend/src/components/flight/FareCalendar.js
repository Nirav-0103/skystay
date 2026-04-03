import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// Generate mock price data for demo (replace with real API)
function generatePrices(year, month, basePrice) {
  const days = getDaysInMonth(year, month);
  const prices = {};
  for (let d = 1; d <= days; d++) {
    const variance = (Math.random() - 0.5) * 0.6;
    prices[d] = Math.round(basePrice * (1 + variance) / 100) * 100;
  }
  return prices;
}

export default function FareCalendar({ basePrice = 3500, onDateSelect, selectedDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setLoading(true);
    setAnimated(false);
    setTimeout(() => {
      setPrices(generatePrices(viewYear, viewMonth, basePrice));
      setLoading(false);
      setTimeout(() => setAnimated(true), 50);
    }, 300);
  }, [viewYear, viewMonth, basePrice]);

  const days = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const priceValues = Object.values(prices);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);

  const getColor = (price) => {
    if (!price) return 'var(--border-light)';
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    if (ratio < 0.33) return '#d1fae5'; // cheap - green
    if (ratio < 0.66) return '#fef3c7'; // medium - yellow
    return '#fee2e2'; // expensive - red
  };

  const getTextColor = (price) => {
    if (!price) return 'var(--text-muted)';
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    if (ratio < 0.33) return '#065f46';
    if (ratio < 0.66) return '#92400e';
    return '#991b1b';
  };

  const isPast = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d.toDateString() === new Date(selectedDate).toDateString();
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const goBack = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const goForward = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0d1b2e, #1a6ef5)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={goBack} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
          <FiChevronLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem' }}>{monthNames[viewMonth]} {viewYear}</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', marginTop: 2 }}>Fare Calendar • Best prices highlighted</div>
        </div>
        <button onClick={goForward} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
          <FiChevronRight size={18} />
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {dayNames.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {/* Empty cells */}
          {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}

          {/* Day cells */}
          {[...Array(days)].map((_, i) => {
            const day = i + 1;
            const price = prices[day];
            const past = isPast(day);
            const sel = isSelected(day);

            return (
              <button key={day}
                onClick={() => !past && onDateSelect && onDateSelect(new Date(viewYear, viewMonth, day))}
                disabled={past}
                style={{
                  padding: '6px 2px', borderRadius: 10, border: sel ? '2px solid #1a6ef5' : '1.5px solid transparent',
                  background: sel ? '#1a6ef5' : loading ? 'var(--border-light)' : getColor(price),
                  cursor: past ? 'not-allowed' : 'pointer', opacity: past ? 0.35 : 1,
                  transition: `all 0.2s ease ${(i % 7) * 0.03}s`,
                  transform: animated ? 'scale(1)' : 'scale(0.8)',
                  textAlign: 'center',
                }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: sel ? 'white' : 'var(--text-primary)', marginBottom: 2 }}>{day}</div>
                {loading
                  ? <div style={{ height: 10, background: 'rgba(0,0,0,0.08)', borderRadius: 4 }} />
                  : <div style={{ fontSize: '0.62rem', fontWeight: 700, color: sel ? 'rgba(255,255,255,0.85)' : getTextColor(price) }}>
                      ₹{price ? (price >= 1000 ? `${(price/1000).toFixed(1)}k` : price) : '-'}
                    </div>
                }
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { color: '#d1fae5', text: '#065f46', label: 'Cheap' },
            { color: '#fef3c7', text: '#92400e', label: 'Moderate' },
            { color: '#fee2e2', text: '#991b1b', label: 'Expensive' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: `1px solid ${l.text}30` }} />
              <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
