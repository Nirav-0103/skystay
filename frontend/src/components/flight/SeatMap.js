import { useState } from 'react';
import { FiUser } from 'react-icons/fi';

const ROWS = 20;
const SEATS_PER_ROW = 6;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function SeatMap({ seatClasses, passengers = 1, selectedClass, onSeatSelect, bookedSeats = [] }) {
  const [selected, setSelected] = useState([]);

  const handleSelect = (seatId, sClass) => {
    if (bookedSeats.includes(seatId)) return;
    
    let newSelected = [...selected];
    const exists = newSelected.find(s => s.id === seatId);
    
    if (exists) {
      newSelected = newSelected.filter(s => s.id !== seatId);
    } else {
      if (newSelected.length >= passengers) {
        newSelected.shift(); // remove first to allow new
      }
      newSelected.push({ id: seatId, class: sClass });
    }
    
    setSelected(newSelected);
    // Propagate to parent [id].js format: array of {id}
    onSeatSelect(newSelected, sClass === 'business' ? 'Business' : sClass === 'premium' ? 'Premium Economy' : 'Economy');
  };

  const getSeatClass = (row, letter) => {
    // 1-4 Business Class, 5-10 Premium Economy, 11-20 Economy
    if (row <= 4) return 'business';
    if (row <= 10) return 'premium';
    return 'economy';
  };

  const getSeatPrice = (seatClass, isWindow, isAisle) => {
    let base = seatClass === 'business' ? 5000 : seatClass === 'premium' ? 2000 : 0;
    if (isWindow || isAisle) base += 500;
    return base;
  };

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 24, border: '1px solid var(--border)' }}>
      <h3 style={{ fontWeight: 800, marginBottom: 20 }}>Select Your Seats</h3>
      
      {/* Plane fuselage layout */}
      <div style={{ 
        maxWidth: 320, margin: '0 auto', 
        background: '#f8fafc', 
        border: '4px solid #cbd5e1', 
        borderRadius: '80px 80px 40px 40px',
        padding: '60px 20px 40px',
        position: 'relative'
      }}>
        {/* Cockpit curve */}
        <div style={{ 
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 140, height: 60, borderBottom: '4px solid #cbd5e1',
          content: '""'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: ROWS }).map((_, rowIdx) => {
            const row = rowIdx + 1;
            return (
              <div key={row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {LETTERS.slice(0, 3).map(letter => {
                    const seatId = `${row}${letter}`;
                    const isBooked = bookedSeats.includes(seatId);
                    const isSelected = selected.some(s => s.id === seatId);
                    const seatClass = getSeatClass(row, letter);
                    
                    return (
                      <button
                        key={seatId}
                        disabled={isBooked}
                        onClick={() => handleSelect(seatId, seatClass)}
                        className={`seat ${seatClass} ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                        title={`${seatId} ${isBooked ? '(Booked)' : ''}`}
                      >
                       {isSelected && <FiUser size={14} />}
                      </button>
                    );
                  })}
                </div>
                
                {/* Aisle */}
                <div style={{ width: 30, textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  {row}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {LETTERS.slice(3, 6).map(letter => {
                    const seatId = `${row}${letter}`;
                    const isBooked = bookedSeats.includes(seatId);
                    const isSelected = selected.some(s => s.id === seatId);
                    const seatClass = getSeatClass(row, letter);
                    
                    return (
                      <button
                         key={seatId}
                         disabled={isBooked}
                         onClick={() => handleSelect(seatId, seatClass)}
                         className={`seat ${seatClass} ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                         title={`${seatId} ${isBooked ? '(Booked)' : ''}`}
                      >
                        {isSelected && <FiUser size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 24, justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="seat business" style={{ pointerEvents: 'none' }} /> Business</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="seat premium" style={{ pointerEvents: 'none' }} /> Premium</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="seat economy" style={{ pointerEvents: 'none' }} /> Economy</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="seat selected" style={{ pointerEvents: 'none' }} /> Selected</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="seat booked" style={{ pointerEvents: 'none' }} /> Booked</div>
      </div>

      <style jsx>{`
        .seat {
          width: 32px; height: 32px;
          border-radius: 6px;
          border: 1px solid var(--border-light);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          color: white;
        }
        .seat:hover:not(.booked) { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: var(--primary); }
        .business { background: #e0e7ff; border-color: #818cf8; }
        .premium { background: #ffedd5; border-color: #fb923c; }
        .economy { background: #f1f5f9; border-color: #cbd5e1; }
        .selected { background: var(--primary) !important; border-color: var(--primary) !important; box-shadow: 0 4px 12px rgba(26,110,245,0.4); }
        .booked { background: #cbd5e1 !important; border-color: #94a3b8 !important; cursor: not-allowed; opacity: 0.5; }
      `}</style>
    </div>
  );
}
