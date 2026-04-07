import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import HotelCard from '../../components/hotel/HotelCard';
import { CardSkeleton } from '../../components/common/Skeleton';
import { hotelAPI } from '../../utils/api';
import { useCurrency } from '../../context/CurrencyContext';
import { FiFilter, FiSearch, FiX, FiMap, FiList } from 'react-icons/fi';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('../../components/hotel/HotelMap'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }} />
});

const CITIES = ['Mumbai', 'Delhi', 'Goa', 'Bangalore', 'Chennai', 'Kolkata', 'Jaipur', 'Udaipur'];

export default function HotelsPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ city: '', maxPrice: '', sort: 'rating', search: '' });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    if (!router.isReady) return;
    const { city } = router.query;
    const f = { city: city || '', maxPrice: '', sort: 'rating', search: '' };
    if (city) setFilters(f);
    fetchHotels(f);
  }, [router.isReady, router.query.city]);

  const fetchHotels = async (params = filters) => {
    setLoading(true);
    try {
      const query = {};
      if (params.city) query.city = params.city;
      if (params.maxPrice) query.maxPrice = params.maxPrice;
      if (params.sort) query.sort = params.sort;
      if (params.search) query.search = params.search;
      const res = await hotelAPI.getAll(query);
      setHotels(res.data.hotels);
      setTotal(res.data.total);
    } catch { setHotels([]); }
    setLoading(false);
  };

  return (
    <>
      <Head><title>Hotels - SkyStay</title></Head>
      <Navbar />
      <div className="page-header">
        <div className="container">
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.3rem, 3vw, 2rem)' }}>
            {filters.city ? `Hotels in ${filters.city}` : 'All Hotels'}
          </h1>
          <p style={{ opacity: 0.8, marginTop: 4 }}>{total} properties found</p>
        </div>
      </div>

      <div className="container" style={{ padding: '24px 24px 60px' }}>
        {/* Filter Bar */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 24, border: '1px solid var(--border)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ minWidth: 200, flex: 2 }}>
            <label className="input-label">Search Hotel</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="input-field" 
                type="text" 
                placeholder="e.g. Taj, Marriott..." 
                value={filters.search} 
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && fetchHotels(filters)}
                style={{ paddingLeft: 40 }}
              />
              <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
          <div className="input-group" style={{ minWidth: 150, flex: 1 }}>
            <label className="input-label">City</label>
            <select className="input-field" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })}>
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ minWidth: 150, flex: 1 }}>
            <label className="input-label">Max Price</label>
            <select className="input-field" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}>
              <option value="">Any</option>
              <option value="5000">Under {formatPrice(5000)}</option>
              <option value="10000">Under {formatPrice(10000)}</option>
              <option value="20000">Under {formatPrice(20000)}</option>
              <option value="50000">Under {formatPrice(50000)}</option>
            </select>
          </div>
          <div className="input-group" style={{ minWidth: 150, flex: 1 }}>
            <label className="input-label">Sort by</label>
            <select className="input-field" value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
              <option value="rating">Top Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => fetchHotels(filters)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiFilter size={16} /> Apply
          </button>
          {(filters.city || filters.maxPrice || filters.search) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setFilters({ city: '', maxPrice: '', sort: 'rating', search: '' }); fetchHotels({ city: '', maxPrice: '', sort: 'rating', search: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiX size={14} /> Clear
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: 4, gap: 4 }}>
            <button onClick={() => setViewMode('list')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', background: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? 'white' : 'var(--text-secondary)' }}>
              <FiList size={16} /> List
            </button>
            <button onClick={() => setViewMode('map')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', background: viewMode === 'map' ? 'var(--primary)' : 'transparent', color: viewMode === 'map' ? 'white' : 'var(--text-secondary)' }}>
              <FiMap size={16} /> Map
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : hotels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏨</div>
            <h3 style={{ marginBottom: 8 }}>No hotels found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : viewMode === 'list' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
            {hotels.map(hotel => <HotelCard key={hotel._id} hotel={hotel} />)}
          </div>
        ) : (
          <div style={{ height: 'calc(100vh - 350px)', minHeight: 600, borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', display: 'flex' }}>
            <div className="desktop-only" style={{ width: 400, height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {hotels.map(hotel => <HotelCard key={hotel._id} hotel={hotel} compact />)}
            </div>
            <div style={{ flex: 1, height: '100%' }}>
              <MapView hotels={hotels} />
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}