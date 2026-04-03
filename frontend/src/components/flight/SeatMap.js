import { useState, useEffect } from 'react';
import { MdAirlineSeatReclineNormal, MdAirlineSeatReclineExtra } from 'react-icons/md';
import { FiCheck, FiX } from 'react-icons/fi';

const CLASS_CONFIG = {
  'First Class': { rows: 2, cols: 4, colLabels: ['A','_','B','_','C','_','D'], color: '#d4af37', bg: '#fdf6e3', icon: '👑', price: null },
  'Business': { rows: 4, cols: 4, colLabels: ['A','_','B','_','C','_','D'], color: '#6366f1', bg: '#eef2ff', icon: '💼', price: null },
  'Economy': { rows: 20, cols: 6, colLabels: ['A','B','C','_','D','E','F'], color: '#1a6ef5', bg: '#e8f0fe', icon: '✈️', price: null },
};

function generateSeats(rows, cols, bookedSeats = []) {
  const seats = [];
  for (let r = 1; r <= rows; r++) {
    const rowSeats = [];
    const letters = cols === 4 ? ['A','B','C','D'] : ['A','B','C','D','E','F'];
    letters.forEach(col => {
      const id = `${r}${col}`;
      const rand = Math.random();
      rowSeats.push({
        id,
        row: r,
        col,
        status: bookedSeats.includes(id) ? 'booked' : rand < 0.25 ? 'booked' : rand < 0.35 ? 'reserved' : 'available',
      });
    });
    seats.push(rowSeats);
  }
  return seats;
}

export default function SeatMap({ seatClasses = [], passengers = 1, onSeatSelect, selectedClass }) {
  const [activeClass, setActiveClass] = useState(selectedClass || seatClasses[0]?.className || 'Economy');
  const [seats, setSeats] = useState({});
  const [selected, setSelected] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const newSeats = {};
    seatClasses.forEach(sc => {
      const cfg = CLASS_CONFIG[sc.className];
      if (cfg) newSeats[sc.className] = generateSeats(cfg.rows, 4);
    });
    if (!seatClasses.length) {
      newSeats['Economy'] = generateSeats(20, 6);
      newSeats['Business'] = generateSeats(4, 4);
      newSeats['First Class'] = generateSeats(2, 4);
    }
    setSeats(newSeats);
    setTimeout(() => setAnimated(true), 100);
  }, []);

  useEffect(() => {
    setSelected([]);
    setAnimated(false);
    setTimeout(() => setAnimated(true), 50);
  }, [activeClass]);

  const handleSeatClick = (seat) => {
    if (seat.status === 'booked' || seat.status === 'reserved') return;
    setSelected(prev => {
      const exists = prev.find(s => s.id === seat.id);
      if (exists) return prev.filter(s => s.id !== seat.id);
      if (prev.length >= passengers) return [...prev.slice(1), seat];
      return [...prev, seat];
    });
  };

  useEffect(() => {
    if (onSeatSelect) onSeatSelect(selected, activeClass);
  }, [selected, activeClass]);

  const currentSeats = seats[activeClass] || [];
  const cfg = CLASS_CONFIG[activeClass] || CLASS_CONFIG['Economy'];
  const sc = seatClasses.find(s => s.className === activeClass);

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Class Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(seatClasses.length ? seatClasses : [{ className: 'Economy' }, { className: 'Business' }, { className: 'First Class' }]).map(sc => {
          const c = CLASS_CONFIG[sc.className];
          const isActive = activeClass === sc.className;
          return (
            <button key={sc.className} onClick={() => setActiveClass(sc.className)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, border: `2px solid ${isActive ? c?.color : 'var(--border)'}`, background: isActive ? c?.bg : 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.25s', transform: isActive ? 'translateY(-2px)' : 'none', boxShadow: isActive ? `0 4px 12px ${c?.color}30` : 'none', color: isActive ? c?.color : 'var(--text-secondary)' }}>
              {c?.icon} {sc.className}
              {sc.price && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>₹{sc.price?.toLocaleString()}</span>}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#e2e8f0', label: 'Available', border: '#cbd5e1' },
          { color: cfg.color, label: 'Selected', border: cfg.color },
          { color: '#fee2e2', label: 'Booked', border: '#fca5a5' },
          { color: '#fef3c7', label: 'Reserved', border: '#fcd34d' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: l.color, border: `2px solid ${l.border}` }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Plane Nose */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ display: 'inline-block', padding: '6px 24px', background: 'linear-gradient(135deg, #0d1b2e, #1a3a6e)', borderRadius: '30px 30px 0 0', color: 'white', fontSize: '0.78rem', fontWeight: 700 }}>✈ FRONT</div>
      </div>

      {/* Seat Map Container */}
      <div style={{ background: 'linear-gradient(180deg, #f8fafd 0%, #ffffff 100%)', borderRadius: 16, border: '2px solid var(--border)', padding: '20px 12px', maxHeight: 420, overflowY: 'auto', position: 'relative' }}>
        {/* Column Labels */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 10 }}>
          <div style={{ width: 32 }} />
          {(activeClass === 'Economy' ? ['A','B','C','','D','E','F'] : ['A','B','','C','D']).map((col, i) => (
            <div key={i} style={{ width: col ? 32 : 20, textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>{col}</div>
          ))}
        </div>

        {/* Rows */}
        {currentSeats.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4, opacity: animated ? 1 : 0, transform: animated ? 'translateX(0)' : `translateX(${ri % 2 === 0 ? -20 : 20}px)`, transition: `all 0.3s ease ${ri * 0.02}s` }}>
            {/* Row number */}
            <div style={{ width: 32, textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{ri + 1}</div>
            {/* Seats */}
            {(activeClass === 'Economy' ? ['A','B','C',null,'D','E','F'] : ['A','B',null,'C','D']).map((col, ci) => {
              if (!col) return <div key={ci} style={{ width: 20 }} />;
              const seat = row.find(s => s.col === col);
              if (!seat) return <div key={ci} style={{ width: 32 }} />;
              const isSelected = selected.find(s => s.id === seat.id);
              const isHov = hovered === seat.id;

              let bg = '#e2e8f0', border = '#cbd5e1', cursor = 'pointer';
              if (seat.status === 'booked') { bg = '#fee2e2'; border = '#fca5a5'; cursor = 'not-allowed'; }
              else if (seat.status === 'reserved') { bg = '#fef3c7'; border = '#fcd34d'; cursor = 'not-allowed'; }
              else if (isSelected) { bg = cfg.color; border = cfg.color; }
              else if (isHov) { bg = cfg.bg; border = cfg.color; }

              return (
                <div key={ci}
                  onClick={() => handleSeatClick(seat)}
                  onMouseEnter={() => seat.status === 'available' && setHovered(seat.id)}
                  onMouseLeave={() => setHovered(null)}
                  title={`Seat ${seat.id} - ${seat.status}`}
                  style={{ width: 32, height: 28, borderRadius: '6px 6px 4px 4px', background: bg, border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor, transition: 'all 0.15s', transform: isSelected ? 'scale(1.1)' : isHov ? 'scale(1.05)' : 'scale(1)', boxShadow: isSelected ? `0 2px 8px ${cfg.color}50` : 'none' }}>
                  {isSelected ? <FiCheck size={12} color="white" /> : seat.status === 'booked' ? <FiX size={10} color="#ef4444" /> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected Summary */}
      {selected.length > 0 && (
        <div style={{ marginTop: 16, padding: '14px 18px', background: `${cfg.bg}`, borderRadius: 12, border: `1.5px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>Selected Seats</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {selected.map(s => (
                <span key={s.id} style={{ padding: '3px 10px', background: cfg.color, color: 'white', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>{s.id}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selected.length}/{passengers} selected</div>
            {selected.length < passengers && (
              <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>Select {passengers - selected.length} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
