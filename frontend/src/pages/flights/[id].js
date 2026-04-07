import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import PaymentModal from '../../components/payment/PaymentModal';
import SeatMap from '../../components/flight/SeatMap';
import AncillaryAddons from '../../components/flight/AncillaryAddons';
import SpecialAssistance from '../../components/flight/SpecialAssistance';
import PriceAlert from '../../components/flight/PriceAlert';
import FareCalendar from '../../components/flight/FareCalendar';
import LoyaltyProgram from '../../components/loyalty/LoyaltyProgram';
import { flightAPI, bookingAPI, authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';
import { FiClock, FiUsers, FiCheck, FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi';
import { MdFlight } from 'react-icons/md';

const SECTIONS = [
  { id: 'seats', label: '💺 Seat Selection', desc: 'Choose your preferred seat' },
  { id: 'addons', label: '🧳 Add-ons & Services', desc: 'Meals, baggage & more' },
  { id: 'assistance', label: '♿ Special Assistance', desc: 'Accessibility & special needs' },
  { id: 'calendar', label: '📅 Fare Calendar', desc: 'Find cheapest travel dates' },
  { id: 'passengers', label: '👤 Passenger Details', desc: 'Travel information required' },
];

export default function FlightDetail() {
  const router = useRouter();
  const { id, passengers: qPass = 1, class: qClass = 'Economy' } = router.query;
  const { user, refreshUser } = useAuth();
  const { formatPrice } = useCurrency();
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(qClass);
  const [passengers, setPassengers] = useState(Number(qPass));
  const [showPayment, setShowPayment] = useState(false);
  const [expandedSection, setExpandedSection] = useState('seats');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [addons, setAddons] = useState([]);
  const [assistance, setAssistance] = useState([]);
  const [passengerDetails, setPassengerDetails] = useState([]);
  const [savedPassengers, setSavedPassengers] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [animated, setAnimated] = useState(false);

  const VALID_PROMOS = { 'SKY10': 0.10, 'FIRST20': 0.20, 'SKYSTAY15': 0.15 };

  useEffect(() => {
    if (user) {
      authAPI.getSavedPassengers().then(res => {
        if (res.data.success) setSavedPassengers(res.data.savedPassengers || []);
      }).catch(err => console.error('Failed to fetch saved passengers:', err));
    }
  }, [user]);

  useEffect(() => {
    if (!id) return;
    flightAPI.getById(id).then(r => {
      setFlight(r.data.flight);
      setLoading(false);
      setTimeout(() => setAnimated(true), 100);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (qClass) setSelectedClass(qClass);
    if (qPass) {
      const n = Number(qPass);
      setPassengers(n);
      setPassengerDetails(Array.from({ length: n }, (_, i) => ({
        name: i === 0 && user ? user.name : '',
        age: '', gender: '', idType: 'Aadhar', idNumber: '',
        saveInfo: false
      })));
    }
  }, [qClass, qPass, user]);

  const seat = flight?.seatClasses?.find(s => s.className === selectedClass);
  const baseTotal = seat ? seat.price * passengers : 0;
  const addonsTotal = addons.reduce((s, a) => {
    const per = a.per === '/person' ? passengers : 1;
    return s + (a.price * per);
  }, 0);
  const discount = promoApplied ? Math.round(baseTotal * VALID_PROMOS[promoApplied]) : 0;
  const total = baseTotal + addonsTotal - discount;

  const applyPromo = () => {
    const code = promoCode.toUpperCase().trim();
    if (VALID_PROMOS[code]) {
      setPromoApplied(code);
      toast.success(`Promo applied! ${Math.round(VALID_PROMOS[code] * 100)}% off`);
    } else {
      toast.error('Invalid promo code. Try SKY10 or FIRST20');
    }
  };

  const handleBookNow = () => {
    if (!user) { toast.error('Please sign in to book'); return; }
    if (!seat) { toast.error('Please select a seat class'); return; }
    if (seat.seatsAvailable < passengers) { toast.error('Not enough seats available'); return; }

    // 🔹 Validate Passenger Details
    for (let i = 0; i < passengerDetails.length; i++) {
      const p = passengerDetails[i];
      if (!p.name?.trim() || !p.age || !p.gender) {
        toast.error(`Please fill all details for Passenger ${i + 1}`);
        setExpandedSection('passengers');
        // Scroll to the passenger details section
        document.getElementById('passengers')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentMethod, paymentDetails = {}) => {
    try {
      const res = await bookingAPI.create({
        bookingType: 'flight', flight: id,
        date: flight.date, // ✅ Send flight date
        seatClass: selectedClass, passengers,
        selectedSeats: selectedSeats.map(s => s.id),
        addons, assistance, passengerDetails,
        paymentMethod, paymentDetails,
        totalAmount: total,
        promoCode: promoApplied,
      });

      if (!res.data.booking?._id) throw new Error('No booking ID returned');

      // 🔹 Save passenger info if checked
      const toSave = passengerDetails.filter(p => p.saveInfo);
      if (toSave.length > 0) {
        await Promise.all(toSave.map(p => {
          const { saveInfo, ...data } = p;
          return authAPI.savePassenger(data);
        }));
      }

      if (paymentDetails.status === 'failed') {
        toast.error('Payment failed. An automatic refund has been initiated.');
        router.push('/refunds');
        return;
      }

      router.push(`/bookings/${res.data.booking._id}`);
    } catch (err) {
      console.error('Flight booking error:', err);
      toast.error(err.response?.data?.message || 'Booking creation failed');
    }
  };

  const updatePassenger = (idx, field, value) => {
    setPassengerDetails(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  if (loading) return (
    <><Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading flight details...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
  if (!flight) return <><Navbar /><div style={{ textAlign: 'center', padding: 100 }}>Flight not found</div></>;

  return (
    <>
      <Head><title>{flight.from} → {flight.to} - SkyStay</title></Head>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #1a3a6e 60%, #1a6ef5 100%)', padding: 'clamp(24px,4vw,40px) 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260, opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease' }}>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MdFlight size={13} /> {flight.airline} • {flight.flightNumber} • {new Date(flight.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, color: 'white', fontSize: 'clamp(1.5rem,4vw,2.3rem)', lineHeight: 1.1, marginBottom: 12 }}>
                {flight.from} <span style={{ opacity: 0.4 }}>→</span> {flight.to}
              </h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { icon: '⏱', text: flight.duration },
                  { icon: flight.stops === 0 ? '✈' : '🔄', text: flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop`, green: flight.stops === 0 },
                  { icon: '✈', text: flight.aircraft },
                ].map((b, i) => (
                  <span key={i} style={{ background: b.green ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)', color: b.green ? '#6ee7b7' : 'rgba(255,255,255,0.8)', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                    {b.icon} {b.text}
                  </span>
                ))}
              </div>
            </div>
            {/* Flight Times */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease 0.15s' }}>
              {[
                { time: flight.departureTime, code: flight.fromCode, city: flight.from },
                null,
                { time: flight.arrivalTime, code: flight.toCode, city: flight.to }
              ].map((item, i) => item ? (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: 'white', lineHeight: 1 }}>{item.time}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', marginTop: 4 }}>{item.code}</div>
                </div>
              ) : (
                <div key={i} style={{ textAlign: 'center' }}>
                  <MdFlight size={22} color="rgba(255,255,255,0.5)" />
                  <div style={{ width: 60, height: 1, background: 'rgba(255,255,255,0.2)', margin: '6px auto' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* ===== LEFT ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Class Selection */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: 24, opacity: animated ? 1 : 0, transform: animated ? 'none' : 'translateY(20px)', transition: 'all 0.5s ease' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>✈️ Select Class</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {flight.seatClasses?.map(sc => {
                  const isActive = selectedClass === sc.className;
                  const colors = { 'Economy': '#1a6ef5', 'Business': '#6366f1', 'First Class': '#d4af37' };
                  const col = colors[sc.className] || '#1a6ef5';
                  return (
                    <div key={sc.className} onClick={() => setSelectedClass(sc.className)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: 12, border: `2px solid ${isActive ? col : 'var(--border)'}`, background: isActive ? col + '08' : 'white', cursor: 'pointer', transition: 'all 0.2s', transform: isActive ? 'scale(1.01)' : 'scale(1)', boxShadow: isActive ? `0 4px 16px ${col}20` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isActive ? col : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                          {isActive && <div style={{ width: 10, height: 10, borderRadius: '50%', background: col }} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: isActive ? col : 'var(--text-primary)', fontSize: '0.95rem' }}>{sc.className}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}><FiUsers size={10} style={{ display: 'inline', marginRight: 3 }} />{sc.seatsAvailable} seats available</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: col, fontSize: '1.15rem' }}>₹{sc.price?.toLocaleString()}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>per person</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fare Rules */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiInfo size={16} color="var(--primary)" /> Fare Rules
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Cancellation', value: 'Free within 24h', ok: true },
                  { label: 'Date Change', value: '₹500 fee', ok: false },
                  { label: 'Refund', value: '7-10 business days', ok: true },
                  { label: 'Baggage', value: '15kg included', ok: true },
                ].map(r => (
                  <div key={r.label} style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: r.ok ? '#d1fae5' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', flexShrink: 0 }}>
                      {r.ok ? '✓' : '!'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{r.label}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{r.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accordion Sections */}
            {SECTIONS.map((section, i) => (
              <div key={section.id} id={section.id}
                style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${expandedSection === section.id ? 'var(--primary)' : 'var(--border)'}`, overflow: 'hidden', opacity: animated ? 1 : 0, transform: animated ? 'none' : 'translateY(20px)', transition: `opacity 0.5s ease ${0.1 + i * 0.06}s, transform 0.5s ease ${0.1 + i * 0.06}s, border-color 0.2s` }}>
                <button onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedSection === section.id ? 'var(--primary-light)' : 'white', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{section.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{section.desc}</div>
                  </div>
                  {expandedSection === section.id ? <FiChevronUp size={18} color="var(--primary)" /> : <FiChevronDown size={18} color="var(--text-muted)" />}
                </button>
                {expandedSection === section.id && (
                  <div style={{ padding: 20, borderTop: '1px solid var(--border-light)' }}>
                    {section.id === 'seats' && (
                      <SeatMap seatClasses={flight.seatClasses} passengers={passengers} selectedClass={selectedClass}
                        onSeatSelect={(seats, cls) => { setSelectedSeats(seats); if (cls) setSelectedClass(cls); }} />
                    )}
                    {section.id === 'addons' && (
                      <AncillaryAddons passengers={passengers} onAddonsChange={setAddons} />
                    )}
                    {section.id === 'assistance' && (
                      <SpecialAssistance passengers={passengers} onAssistanceChange={setAssistance} />
                    )}
                    {section.id === 'calendar' && (
                      <FareCalendar basePrice={seat?.price || 3500} onDateSelect={date => toast.success(`Selected: ${date.toLocaleDateString('en-IN')}`)} />
                    )}
                    {section.id === 'passengers' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {passengerDetails.map((p, idx) => (
                          <div key={idx} style={{ padding: 18, background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Passenger {idx + 1}</div>
                              {savedPassengers.length > 0 && (
                                <select 
                                  className="input-field" 
                                  style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem' }}
                                  onChange={(e) => {
                                    const saved = savedPassengers.find(sp => sp._id === e.target.value);
                                    if (saved) {
                                      const { _id, isDefault, ...data } = saved;
                                      setPassengerDetails(prev => prev.map((item, i) => i === idx ? { ...item, ...data } : item));
                                    }
                                  }}
                                >
                                  <option value="">Select Saved Passenger</option>
                                  {savedPassengers.map(sp => (
                                    <option key={sp._id} value={sp._id}>{sp.name} ({sp.age})</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                              {[
                                { label: 'Full Name', field: 'name', type: 'text', placeholder: 'As on ID' },
                                { label: 'Age', field: 'age', type: 'number', placeholder: 'Age' },
                                { label: 'Gender', field: 'gender', type: 'select', options: ['Male','Female','Other'] },
                                { label: 'ID Type (Optional)', field: 'idType', type: 'select', options: ['Aadhar','Passport','PAN','Voter ID'] },
                                { label: 'ID Number (Optional)', field: 'idNumber', type: 'text', placeholder: 'ID Number' },
                              ].map(f => (
                                <div key={f.field} className="input-group">
                                  <label className="input-label">{f.label}</label>
                                  {f.type === 'select'
                                    ? <select className="input-field" value={p[f.field]} onChange={e => updatePassenger(idx, f.field, e.target.value)}>
                                        <option value="">Select</option>
                                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                      </select>
                                    : <input className="input-field" type={f.type} placeholder={f.placeholder} value={p[f.field]} onChange={e => updatePassenger(idx, f.field, e.target.value)} />
                                  }
                                </div>
                              ))}
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <input 
                                type="checkbox" 
                                checked={p.saveInfo} 
                                onChange={e => updatePassenger(idx, 'saveInfo', e.target.checked)} 
                                style={{ width: 16, height: 16 }}
                              />
                              Save this passenger for future bookings
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Price Alert */}
            <PriceAlert from={flight.from} to={flight.to} currentPrice={seat?.price || flight.basePrice} user={user} />

            {/* Loyalty compact */}
            {user && <LoyaltyProgram user={user} compact />}
          </div>

          {/* ===== RIGHT: Booking Summary ===== */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-md)', opacity: animated ? 1 : 0, transform: animated ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease 0.25s' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Booking Summary</h3>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Passengers</label>
                <select className="input-field" value={passengers} onChange={e => {
                  const n = Number(e.target.value);
                  setPassengers(n);
                  setPassengerDetails(Array.from({ length: n }, (_, i) => passengerDetails[i] || { name: '', age: '', gender: '', idType: 'Aadhar', idNumber: '' }));
                }}>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>

              {/* Price breakdown */}
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <span>{formatPrice(seat?.price || 0)} × {passengers}</span>
                  <span>{formatPrice(baseTotal)}</span>
                </div>
                {addonsTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    <span>Add-ons</span><span>+{formatPrice(addonsTotal)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <span>Taxes & Fees</span><span>Included</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#10b981', fontWeight: 600, marginBottom: 8 }}>
                    <span>Promo ({promoApplied})</span><span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Promo Code */}
              {!promoApplied ? (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input value={promoCode} onChange={e => setPromoCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    placeholder="Promo code (try SKY10)"
                    style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace', fontWeight: 600 }} />
                  <button onClick={applyPromo} style={{ padding: '9px 14px', background: 'var(--primary-light)', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Apply</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#d1fae5', borderRadius: 10, marginBottom: 16 }}>
                  <FiCheck size={15} color="#065f46" />
                  <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>✅ {promoApplied} — Saving ₹{discount.toLocaleString()}</span>
                  <button onClick={() => { setPromoApplied(null); setPromoCode(''); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
                </div>
              )}

              {selectedSeats.length > 0 && (
                <div style={{ marginBottom: 14, padding: '8px 12px', background: 'var(--primary-light)', borderRadius: 8, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Seats:</span>
                  {selectedSeats.map(s => <span key={s.id} style={{ fontWeight: 700, color: 'var(--primary)', background: 'white', padding: '1px 8px', borderRadius: 6 }}>{s.id}</span>)}
                </div>
              )}

              <button className="btn btn-primary btn-lg" style={{ width: '100%', fontSize: '1rem', padding: '15px' }} onClick={handleBookNow} disabled={!seat}>
                {user ? '🔒 Book Now' : 'Sign In to Book'}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                {['✅ Free cancellation within 24 hrs', '⚡ Instant confirmation', '🔒 256-bit SSL secure', '🎯 Best price guarantee'].map(t => (
                  <div key={t} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t}</div>
                ))}
              </div>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
                {['💳 Card','📱 UPI','🏦 Net Banking','GPay','PhonePe','Paytm'].map(m => (
                  <span key={m} style={{ fontSize: '0.66rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border-light)' }}>{m}</span>
                ))}
              </div>
            </div>

            {user && (
              <div style={{ marginTop: 12, background: 'linear-gradient(135deg, #fdf6e3, #fef9ec)', borderRadius: 14, border: '1.5px solid #d4af3740', padding: '14px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>✨</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#92400e' }}>Earn {Math.floor(total * 0.01)} SkyPoints</div>
                <div style={{ fontSize: '0.72rem', color: '#a16207', marginTop: 2 }}>~1% cashback on this booking</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal amount={total} bookingData={{ bookingType: 'flight' }} user={user}
          razorpayKey="rzp_test_Saa4MIHeMmOARW"
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
          onRefreshUser={refreshUser} />
      )}

      <Footer />
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .container > div > div:first-child + div {
            position: static !important;
          }
        }
      `}</style>
    </>
  );
}
