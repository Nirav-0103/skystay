import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import FlightCard from '../../components/flight/FlightCard';
import FareCalendar from '../../components/flight/FareCalendar';
import { FlightSkeleton } from '../../components/common/Skeleton';
import { flightAPI } from '../../utils/api';
import { useCurrency } from '../../context/CurrencyContext';
import { FiSearch, FiFilter, FiX, FiCalendar, FiTrendingDown } from 'react-icons/fi';
import { MdSwapHoriz, MdFlight } from 'react-icons/md';

const CITIES = [
  { name: 'Mumbai', code: 'BOM' }, { name: 'Delhi', code: 'DEL' },
  { name: 'Goa', code: 'GOI' }, { name: 'Bangalore', code: 'BLR' },
  { name: 'Chennai', code: 'MAA' }, { name: 'Kolkata', code: 'CCU' },
  { name: 'Jaipur', code: 'JAI' }, { name: 'Udaipur', code: 'UDR' },
  { name: 'Hyderabad', code: 'HYD' }, { name: 'Pune', code: 'PNQ' },
];

const AIRPORTS = {
  'Mumbai': 'BOM', 'Delhi': 'DEL', 'Goa': 'GOI', 'Bangalore': 'BLR',
  'Chennai': 'MAA', 'Kolkata': 'CCU', 'Jaipur': 'JAI', 'Udaipur': 'UDR',
  'Hyderabad': 'HYD', 'Pune': 'PNQ'
};

export default function FlightsPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [form, setForm] = useState({ from: '', to: '', date: '', returnDate: '', passengers: 1, seatClass: 'Economy', tripType: 'oneway' });
  const [filters, setFilters] = useState({ stops: 'any', sortBy: 'price', maxPrice: '', airline: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [animated, setAnimated] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100);
    if (!router.isReady) return;
    const { from, to, date, passengers } = router.query;
    if (from || to) {
      const f = { from: from || '', to: to || '', date: date || '', returnDate: '', passengers: passengers || 1, seatClass: 'Economy', tripType: 'oneway' };
      setForm(f);
      doSearch(f);
    }
  }, [router.isReady]);

  const doSearch = async (params) => {
    setLoading(true); setSearched(true); setShowCalendar(false);
    try {
      const res = await flightAPI.search({ from: params.from, to: params.to, date: params.date, passengers: params.passengers, seatClass: params.seatClass });
      setFlights(res.data.flights || []);
    } catch { setFlights([]); }
    setLoading(false);
  };

  const swapCities = () => setForm(prev => ({ ...prev, from: prev.to, to: prev.from }));

  // Apply filters
  const filtered = flights
    .filter(f => {
      if (filters.stops === '0') return f.stops === 0;
      if (filters.stops === '1') return f.stops <= 1;
      return true;
    })
    .filter(f => {
      if (!filters.airline) return true;
      return f.airline.toLowerCase().includes(filters.airline.toLowerCase());
    })
    .filter(f => {
      if (!filters.maxPrice) return true;
      const sc = f.seatClasses?.find(s => s.className === form.seatClass);
      return sc && sc.price <= Number(filters.maxPrice);
    })
    .sort((a, b) => {
      const getSc = f => f.seatClasses?.find(s => s.className === form.seatClass);
      if (filters.sortBy === 'price') return (getSc(a)?.price || 0) - (getSc(b)?.price || 0);
      if (filters.sortBy === 'duration') return a.duration?.localeCompare(b.duration);
      if (filters.sortBy === 'departure') return a.departureTime?.localeCompare(b.departureTime);
      return 0;
    });

  const airlines = [...new Set(flights.map(f => f.airline))];

  return (
    <>
      <Head><title>Search Flights - SkyStay</title></Head>
      <Navbar />

      {/* Search Header */}
      <div style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #1a3a6e 60%, #1a6ef5 100%)', padding: 'clamp(24px,4vw,36px) 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 20, opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(-12px)', transition: 'all 0.5s ease' }}>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, color: 'white', fontSize: 'clamp(1.3rem,3vw,1.8rem)', marginBottom: 4 }}>
              ✈️ Search Flights
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>Compare fares, pick your seat, and book instantly</p>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 'clamp(16px,3vw,24px)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s ease 0.1s' }}>
            {/* Trip type */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              {['oneway', 'roundtrip', 'multicity'].map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', color: form.tripType === t ? 'var(--primary)' : 'var(--text-secondary)' }}>
                  <input type="radio" value={t} checked={form.tripType === t} onChange={e => setForm({ ...form, tripType: e.target.value })} style={{ accentColor: 'var(--primary)' }} />
                  {t === 'oneway' ? 'One Way' : t === 'roundtrip' ? 'Round Trip' : 'Multi-City'}
                </label>
              ))}
            </div>

            {/* Search fields */}
            <div className="flight-search-grid" style={{ display: 'grid', gap: 12, alignItems: 'end' }}>
              {/* From */}
              <div className="input-group">
                <label className="input-label">From</label>
                <select className="input-field" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })}>
                  <option value="">Departure City</option>
                  {CITIES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.code})</option>)}
                </select>
              </div>

              {/* Swap - Hidden on mobile or repositioned */}
              <div className="swap-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button onClick={swapCities} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.children[0].style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.children[0].style.color = 'var(--primary)'; }}>
                  <MdSwapHoriz size={20} color="var(--primary)" />
                </button>
              </div>

              {/* To */}
              <div className="input-group">
                <label className="input-label">To</label>
                <select className="input-field" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })}>
                  <option value="">Arrival City</option>
                  {CITIES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.code})</option>)}
                </select>
              </div>

              {/* Departure Date */}
              <div className="input-group">
                <label className="input-label">Departure</label>
                <input className="input-field" type="date" min={today} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>

              {/* Return date (roundtrip only) */}
              {form.tripType === 'roundtrip' && (
                <div className="input-group">
                  <label className="input-label">Return</label>
                  <input className="input-field" type="date" min={form.date || today} value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} />
                </div>
              )}

              {/* Class */}
              <div className="input-group">
                <label className="input-label">Class</label>
                <select className="input-field" value={form.seatClass} onChange={e => setForm({ ...form, seatClass: e.target.value })}>
                  <option>Economy</option>
                  <option>Business</option>
                  <option>First Class</option>
                </select>
              </div>

              {/* Passengers */}
              <div className="input-group">
                <label className="input-label">Pax</label>
                <select className="input-field" value={form.passengers} onChange={e => setForm({ ...form, passengers: e.target.value })}>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Search Button */}
              <button className="btn btn-primary search-submit-btn" onClick={() => doSearch(form)}
                style={{ display: 'flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap', height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 12 }}>
                <FiSearch size={18} /> Search
              </button>
            </div>

            <style jsx>{`
              .flight-search-grid {
                grid-template-columns: 1fr auto 1fr 1fr 1fr auto auto;
              }
              @media (max-width: 1024px) {
                .flight-search-grid {
                  grid-template-columns: 1fr 1fr;
                }
                .swap-container {
                  display: none !important;
                }
                .search-submit-btn {
                  grid-column: span 2;
                  width: 100%;
                }
              }
              @media (max-width: 640px) {
                .flight-search-grid {
                  grid-template-columns: 1fr;
                }
                .search-submit-btn {
                  grid-column: span 1;
                }
              }
            `}</style>

            {/* Fare Calendar Toggle */}
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setShowCalendar(!showCalendar)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: showCalendar ? 'var(--primary-light)' : 'var(--bg)', border: `1.5px solid ${showCalendar ? 'var(--primary)' : 'var(--border)'}`, color: showCalendar ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                <FiCalendar size={16} /> Fare Calendar
              </button>
              <button onClick={() => setShowFilters(!showFilters)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: showFilters ? 'var(--primary-light)' : 'var(--bg)', border: `1.5px solid ${showFilters ? 'var(--primary)' : 'var(--border)'}`, color: showFilters ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                <FiFilter size={16} /> Filters
              </button>
            </div>

            {/* Fare Calendar dropdown */}
            {showCalendar && (
              <div style={{ marginTop: 16, animation: 'fadeInUp 0.25s ease' }}>
                <FareCalendar basePrice={3500} onDateSelect={date => {
                  setForm(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
                  setShowCalendar(false);
                }} />
              </div>
            )}

            {/* Filters panel */}
            {showFilters && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--bg)', borderRadius: 12, display: 'flex', gap: 16, flexWrap: 'wrap', animation: 'fadeInUp 0.25s ease' }}>
                <div className="input-group" style={{ minWidth: 140 }}>
                  <label className="input-label">Stops</label>
                  <select className="input-field" value={filters.stops} onChange={e => setFilters({ ...filters, stops: e.target.value })}>
                    <option value="any">Any</option>
                    <option value="0">Non-stop only</option>
                    <option value="1">Max 1 stop</option>
                  </select>
                </div>
                <div className="input-group" style={{ minWidth: 140 }}>
                  <label className="input-label">Sort by</label>
                  <select className="input-field" value={filters.sortBy} onChange={e => setFilters({ ...filters, sortBy: e.target.value })}>
                    <option value="price">Price (Low–High)</option>
                    <option value="duration">Duration</option>
                    <option value="departure">Departure Time</option>
                  </select>
                </div>
                <div className="input-group" style={{ minWidth: 140 }}>
                  <label className="input-label">Max Price</label>
                  <input className="input-field" type="number" placeholder="e.g. 10000" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
                </div>
                {airlines.length > 0 && (
                  <div className="input-group" style={{ minWidth: 160 }}>
                    <label className="input-label">Airline</label>
                    <select className="input-field" value={filters.airline} onChange={e => setFilters({ ...filters, airline: e.target.value })}>
                      <option value="">All Airlines</option>
                      {airlines.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                )}
                <button onClick={() => setFilters({ stops: 'any', sortBy: 'price', maxPrice: '', airline: '' })}
                  style={{ alignSelf: 'flex-end', padding: '8px 14px', borderRadius: 10, background: '#fee2e2', color: '#ef4444', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <FiX size={13} /> Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...Array(4)].map((_, i) => <FlightSkeleton key={i} />)}
          </div>
        ) : !form.date ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <FiCalendar size={56} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Please select a departure date</h3>
            <p style={{ fontSize: '0.88rem', opacity: 0.7 }}>Select a date in the search bar to see available flights.</p>
          </div>
        ) : searched && filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✈️</div>
            <h3 style={{ marginBottom: 8, fontWeight: 700 }}>No flights found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Try different dates, cities or remove filters</p>
            <button onClick={() => setFilters({ stops: 'any', sortBy: 'price', maxPrice: '', airline: '' })}
              className="btn btn-primary">Clear Filters</button>
          </div>
        ) : filtered.length > 0 ? (
          <>
            {/* Results header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{filtered.length} flight{filtered.length !== 1 ? 's' : ''} found</span>
                {form.from && form.to && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>
                    {form.from} → {form.to}
                  </span>
                )}
              </div>
              {/* Cheapest badge */}
              {filtered[0] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#d1fae5', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', color: '#065f46', fontWeight: 700 }}>
                  <FiTrendingDown size={13} />
                  Best: ₹{filtered[0].seatClasses?.find(s => s.className === form.seatClass)?.price?.toLocaleString() || filtered[0].basePrice?.toLocaleString()}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((f, i) => (
                <div key={f._id} style={{ opacity: 1, transform: 'translateY(0)', animation: `fadeInUp 0.35s ease ${i * 0.04}s both` }}>
                  <FlightCard flight={f} passengers={Number(form.passengers)} seatClass={form.seatClass} />
                </div>
              ))}
            </div>
          </>
        ) : !searched ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <MdFlight size={56} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Search for flights above</h3>
            <p style={{ fontSize: '0.88rem', opacity: 0.7 }}>Select from & to cities, then click Search</p>
          </div>
        ) : null}
      </div>

      <Footer />
    </>
  );
}
