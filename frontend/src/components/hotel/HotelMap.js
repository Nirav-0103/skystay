import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useCurrency } from '../../context/CurrencyContext';
import { useRouter } from 'next/router';
import { FiStar } from 'react-icons/fi';

// Custom Map Marker Icon
const createCustomIcon = (price, formatPrice) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 1px solid white; white-space: nowrap;">
             ${formatPrice(price)}
           </div>`,
    iconSize: [60, 30],
    iconAnchor: [30, 30],
    popupAnchor: [0, -30]
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function HotelMap({ hotels }) {
  const { formatPrice } = useCurrency();
  const router = useRouter();

  // Fix leaflet default icon issue
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/marker-icon-2x.png',
      iconUrl: '/marker-icon.png',
      shadowUrl: '/marker-shadow.png',
    });
  }, []);

  // Calculate center based on hotels or default to India
  const center = hotels.length > 0 && hotels[0].location?.coordinates
    ? [hotels[0].location.coordinates[1], hotels[0].location.coordinates[0]] // Leaflet takes [lat, lng]
    : [20.5937, 78.9629]; // Default India

  const zoom = hotels.length > 0 ? 12 : 5;

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ChangeView center={center} zoom={zoom} />
        
        {hotels.map((hotel) => {
          // If no coordinates provided in sample data, add random offset around center to demonstrate pins
          const lat = hotel.location?.coordinates?.[1] || (center[0] + (Math.random() - 0.5) * 0.1);
          const lng = hotel.location?.coordinates?.[0] || (center[1] + (Math.random() - 0.5) * 0.1);
          
          return (
            <Marker key={hotel._id} position={[lat, lng]} icon={createCustomIcon(hotel.pricePerNight, formatPrice)}>
              <Popup className="custom-popup">
                <div style={{ width: 200, padding: 0 }} onClick={() => router.push(`/hotels/${hotel._id}`)}>
                  <div style={{ height: 120, width: '100%', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
                    <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', color: 'var(--primary)' }}>{hotel.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <FiStar fill="#fbbf24" color="#fbbf24" size={14} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{hotel.rating}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({hotel.reviewCount} reviews)</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatPrice(hotel.pricePerNight)}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-map-marker {
          background: transparent;
          border: none;
        }
        .custom-map-marker > div {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .custom-map-marker:hover > div {
          transform: scale(1.1) translateY(-2px);
          z-index: 1000 !important;
          background: #fbbf24 !important;
          color: #0d1b2e !important;
        }
      `}</style>
    </div>
  );
}
