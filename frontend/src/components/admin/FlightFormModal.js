import { useState } from 'react';
import { flightAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiX, FiPlus, FiTrash2, FiClock, FiMapPin, FiInfo } from 'react-icons/fi';

const CITIES = ['Mumbai', 'Delhi', 'Goa', 'Bangalore', 'Chennai', 'Kolkata', 'Jaipur', 'Udaipur', 'Hyderabad', 'Pune', 'Agra', 'Varanasi'];
const AIRLINES = ['IndiGo', 'Air India', 'Vistara', 'SpiceJet', 'AirAsia India', 'Akasa Air'];

const defaultForm = {
  flightNumber: '',
  airline: 'IndiGo',
  airlineCode: '6E',
  from: '',
  fromCode: '',
  to: '',
  toCode: '',
  departureTime: '',
  arrivalTime: '',
  duration: '',
  date: new Date().toISOString().split('T')[0],
  basePrice: '',
  aircraft: 'Boeing 737',
  stops: 0,
  seatClasses: [
    { className: 'Economy', price: 0, seatsAvailable: 180, totalSeats: 180 },
    { className: 'Business', price: 0, seatsAvailable: 12, totalSeats: 12 }
  ],
  isActive: true
};

export default function FlightFormModal({ flight, onClose, onSave }) {
  const [form, setForm] = useState(flight ? {
    ...flight,
    date: flight.date ? new Date(flight.date).toISOString().split('T')[0] : defaultForm.date,
  } : defaultForm);
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.flightNumber) return toast.error('Flight number is required');
    if (!form.from || !form.to) return toast.error('Origin and Destination are required');
    if (form.from === form.to) return toast.error('Origin and Destination cannot be the same');

    setLoading(true);
    try {
      const data = {
        ...form,
        basePrice: Number(form.basePrice),
        stops: Number(form.stops),
        seatClasses: form.seatClasses.map(sc => ({
          ...sc,
          price: Number(sc.price) || Number(form.basePrice) * (sc.className === 'Business' ? 2.5 : 1),
          seatsAvailable: Number(sc.seatsAvailable),
          totalSeats: Number(sc.totalSeats)
        }))
      };

      if (flight?._id) {
        await flightAPI.update(flight._id, data);
        toast.success('Flight updated! ✈️');
      } else {
        await flightAPI.create(data);
        toast.success('Flight created! ✈️');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save flight');
    }
    setLoading(false);
  };

  const updateSeatClass = (idx, key, val) => {
    const updated = [...form.seatClasses];
    updated[idx] = { ...updated[idx], [key]: val };
    setForm({ ...form, seatClasses: updated });
  };

  const inp = { padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '0.9rem', width: '100%', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)', background: 'var(--bg-card)' };
  const lbl = { fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, display: 'block', color: 'var(--text-secondary)' };

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
      }}
    >
      <div style={{
        background: 'var(--bg-card)', borderRadius: '20px', padding: 32,
        width: '100%', maxWidth: 750, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', margin: 0 }}>
            {flight ? '✈️ Edit Flight' : '🛫 Add New Flight'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <FiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={lbl}>Flight Number *</label>
              <input style={inp} value={form.flightNumber} onChange={e => setForm({ ...form, flightNumber: e.target.value.toUpperCase() })} required placeholder="e.g. AI-101" />
            </div>
            <div>
              <label style={lbl}>Airline *</label>
              <select style={inp} value={form.airline} onChange={e => setForm({ ...form, airline: e.target.value })} required>
                {AIRLINES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Airline Code *</label>
              <input style={inp} value={form.airlineCode} onChange={e => setForm({ ...form, airlineCode: e.target.value.toUpperCase() })} required placeholder="e.g. AI" maxLength={3} />
            </div>

            <div>
              <label style={lbl}>From (Origin) *</label>
              <select style={inp} value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} required>
                <option value="">Select Origin</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>From Code *</label>
              <input style={inp} value={form.fromCode} onChange={e => setForm({ ...form, fromCode: e.target.value.toUpperCase() })} required placeholder="e.g. BOM" maxLength={3} />
            </div>
            <div>
              <label style={lbl}>Date *</label>
              <input style={inp} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>

            <div>
              <label style={lbl}>To (Destination) *</label>
              <select style={inp} value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} required>
                <option value="">Select Destination</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>To Code *</label>
              <input style={inp} value={form.toCode} onChange={e => setForm({ ...form, toCode: e.target.value.toUpperCase() })} required placeholder="e.g. DEL" maxLength={3} />
            </div>
            <div>
              <label style={lbl}>Aircraft</label>
              <input style={inp} value={form.aircraft} onChange={e => setForm({ ...form, aircraft: e.target.value })} placeholder="e.g. Airbus A320" />
            </div>

            <div>
              <label style={lbl}>Departure Time *</label>
              <input style={inp} type="time" value={form.departureTime} onChange={e => setForm({ ...form, departureTime: e.target.value })} required />
            </div>
            <div>
              <label style={lbl}>Arrival Time *</label>
              <input style={inp} type="time" value={form.arrivalTime} onChange={e => setForm({ ...form, arrivalTime: e.target.value })} required />
            </div>
            <div>
              <label style={lbl}>Duration (e.g. 2h 30m) *</label>
              <input style={inp} value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} required placeholder="2h 15m" />
            </div>

            <div>
              <label style={lbl}>Base Price (₹) *</label>
              <input style={inp} type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} required placeholder="4500" />
            </div>
            <div>
              <label style={lbl}>Stops</label>
              <input style={inp} type="number" min="0" value={form.stops} onChange={e => setForm({ ...form, stops: e.target.value })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: 25 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ width: 18, height: 18 }} />
                Flight Active
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ ...lbl, borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>💺 Seat Classes & Inventory</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {form.seatClasses.map((sc, idx) => (
                <div key={sc.className} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>{sc.className} Class</div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Price (₹)</label>
                    <input style={{ ...inp, padding: '6px 10px' }} type="number" value={sc.price} onChange={e => updateSeatClass(idx, 'price', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Available Seats</label>
                    <input style={{ ...inp, padding: '6px 10px' }} type="number" value={sc.seatsAvailable} onChange={e => updateSeatClass(idx, 'seatsAvailable', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer'
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
              background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Processing...' : flight ? 'Update Flight' : 'Create Flight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
