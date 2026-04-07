import { QRCodeCanvas } from 'qrcode.react';

export default function BoardingPass({ booking }) {
  if (!booking || booking.bookingType !== 'flight' || !booking.flight) return null;
  const flight = booking.flight;

  return (
    <div id={`boarding-pass-${booking._id}`} style={{
      width: '800px',
      background: 'white',
      fontFamily: 'Helvetica, Arial, sans-serif',
      color: '#111827',
      position: 'absolute',
      left: '-9999px', // Hidden visually from the DOM
      top: 0
    }}>
      <div style={{ display: 'flex', border: '2px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* Left main part */}
        <div style={{ flex: 1, borderRight: '2px dashed #e5e7eb', position: 'relative' }}>
          {/* Header */}
          <div style={{ background: '#1a6ef5', padding: '16px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '24px', letterSpacing: '2px', fontWeight: 800 }}>SKYSTAY AIRLINES</h2>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>BOARDING PASS</div>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Passenger & Flight info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Passenger Name</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{booking.user?.name || 'Guest'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Flight Date</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{new Date(booking.date || booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>

            {/* Flight Route */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#1a6ef5' }}>{flight.fromCode}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>{flight.from}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '8px' }}>{flight.departureTime}</div>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>FLIGHT</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{flight.flightNumber}</div>
                <div style={{ width: '100%', height: '2px', background: '#e5e7eb', margin: '8px 0', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '20px' }}>✈</div>
                </div>
              </div>

              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#1a6ef5' }}>{flight.toCode}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>{flight.to}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '8px' }}>{flight.arrivalTime}</div>
              </div>
            </div>

            {/* Details Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Gate</div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>TBD</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Boarding Time</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>{flight.departureTime}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Seat</div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>{booking.selectedSeats?.length > 0 ? booking.selectedSeats.join(', ') : 'Any'}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Class</div>
                <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '6px' }}>{booking.seatClass}</div>
              </div>
            </div>

          </div>
        </div>

        {/* Right stub part */}
        <div style={{ width: '250px', background: 'white' }}>
          <div style={{ background: '#1e3a8a', padding: '16px 24px', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '1px' }}>SKYSTAY</div>
          </div>
          
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 56px)' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Passenger</div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>{booking.user?.name || 'Guest'}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Flight</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{flight.flightNumber}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Seat</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{booking.selectedSeats?.[0] || 'Any'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a6ef5' }}>{flight.fromCode}</div>
                <div style={{ fontSize: '16px' }}>✈</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a6ef5' }}>{flight.toCode}</div>
              </div>
            </div>

            {/* QR Code at bottom of stub */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <QRCodeCanvas value={`https://skystay.com/bookings/${booking._id}`} size={100} level={"H"} />
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px' }}>PNR: {booking.bookingId}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
