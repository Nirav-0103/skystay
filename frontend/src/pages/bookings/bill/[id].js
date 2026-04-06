import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../../components/common/Navbar';
import { useAuth } from '../../../context/AuthContext';
import { FiDownload, FiArrowLeft, FiCheckCircle, FiPrinter, FiClock, FiFileText } from 'react-icons/fi';
import { MdFlight, MdHotel } from 'react-icons/md';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = "/api" || 'http://localhost:5000/api';

export default function BillPage() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    if (id && token) fetchBill();
  }, [id, token]);

  const fetchBill = async () => {
    try {
      const res = await fetch(`${API_URL}/bills/${id}/bill`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setBill(data.bill);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.billNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: white;
              padding: 20px;
              color: #111;
            }
            .bill-header {
              background: linear-gradient(135deg, #0d1b2e 0%, #1a3a6e 60%, #1a6ef5 100%) !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .grand-total-row {
              background: linear-gradient(135deg, #0d1b2e, #1a3a6e) !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
          </style>
        </head>
        <body>
          ${content.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SkyStay-Invoice-${bill.billNumber}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
    }
  };

  if (loading) return (
    <><Navbar /><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="loader" /></div></>
  );

  if (!bill) return (
    <><Navbar /><div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}><h2>Bill not found</h2><button className="btn btn-primary" onClick={() => router.push('/bookings')}>My Bookings</button></div></>
  );

  const isHotel = bill.booking.type === 'hotel';

  // FIX: COD = show as 'Pay at Hotel' regardless of what backend sends
  const isPayAtHotel = bill.pricing.paymentMethod === 'Pay at Hotel' || bill.pricing.paymentMethod?.toLowerCase() === 'cod';
  const paymentMethodLabel = isPayAtHotel ? 'Pay at Hotel' : (bill.pricing.paymentMethod || 'Online');

  // FIX: COD booking status logic
  // COD: refund_requested / cancelled → 'Cancelled' (no payment was made)
  // COD: otherwise → 'Pending' (payment not done yet)
  // Online: use backend paymentStatus
  const bookingStatus = bill.booking.status;
  const isCancelledStatus = ['cancelled', 'refund_requested', 'refunded'].includes(bookingStatus);

  const paymentStatus = isPayAtHotel
    ? (isCancelledStatus ? 'Cancelled' : 'Pending')
    : (bill.pricing.paymentStatus || 'Paid');
  const isPaid = paymentStatus === 'Paid';
  const isRefunded = paymentStatus === 'Refunded';
  const isCancelled = paymentStatus === 'Cancelled';

  return (
    <>
      <Head><title>Bill - {bill.billNumber} | SkyStay</title></Head>
      <div className="no-print"><Navbar /></div>

      <div className="container" style={{ padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px) 80px', maxWidth: 800 }}>
        {/* Actions */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiFileText size={14} /> Download PDF
            </button>
            <button className="btn btn-outline btn-sm" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiPrinter size={14} /> Print
            </button>
          </div>
        </div>

        {/* Bill */}
        <div ref={printRef} className="print-bill" style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>

          {/* Header */}
          <div className="bill-header" style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #1a3a6e 60%, #1a6ef5 100%)', padding: '28px 28px', color: 'white' }}>
            <div className="bill-header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <MdFlight size={28} color="white" />
                  <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem' }}>SkyStay</span>
                </div>
                <div style={{ opacity: 0.7, fontSize: '0.8rem' }}>Premium Travel Platform</div>
                <div style={{ opacity: 0.6, fontSize: '0.75rem', marginTop: 4 }}>{bill.company.gstNumber}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>{bill.billNumber}</div>
                <div style={{ opacity: 0.7, fontSize: '0.8rem' }}>Date: {new Date(bill.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div style={{ marginTop: 8 }}>
                  {/* FIX: COD + cancelled/refund_requested → show CANCELLED badge */}
                  <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', background: bill.booking.status === 'confirmed' ? '#4ade80' : isCancelledStatus ? '#ef4444' : '#fbbf24', color: '#0d1b2e', fontSize: '0.75rem', fontWeight: 700 }}>
                    {isCancelledStatus ? 'CANCELLED' : bill.booking.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bill-wrap" style={{ padding: '28px 36px' }}>

            {/* Customer & Company */}
            <div className="bill-customer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>BILLED TO</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{bill.customer.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{bill.customer.email}</div>
                {bill.customer.phone !== 'N/A' && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{bill.customer.phone}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>FROM</div>
                <div style={{ fontWeight: 700 }}>{bill.company.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{bill.company.email}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{bill.company.phone}</div>
              </div>
            </div>

            {/* Booking Details */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 14 }}>
                {isHotel ? '🏨 HOTEL DETAILS' : '✈️ FLIGHT DETAILS'}
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', border: '1px solid var(--border-light)' }}>
                {isHotel ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>HOTEL</div><div style={{ fontWeight: 700 }}>{bill.details.hotelName}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>CITY</div><div style={{ fontWeight: 600 }}>{bill.details.city}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>ROOM TYPE</div><div style={{ fontWeight: 600 }}>{bill.details.roomType}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>CHECK IN</div><div style={{ fontWeight: 600 }}>{bill.details.checkIn ? new Date(bill.details.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>CHECK OUT</div><div style={{ fontWeight: 600 }}>{bill.details.checkOut ? new Date(bill.details.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>NIGHTS</div><div style={{ fontWeight: 600 }}>{bill.details.nights || 1}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>GUESTS</div><div style={{ fontWeight: 600 }}>{bill.details.guests || 1}</div></div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>FLIGHT</div><div style={{ fontWeight: 700 }}>{bill.details.flightNumber}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>AIRLINE</div><div style={{ fontWeight: 600 }}>{bill.details.airline}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>FROM</div><div style={{ fontWeight: 600 }}>{bill.details.from}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>TO</div><div style={{ fontWeight: 600 }}>{bill.details.to}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>DEPARTURE</div><div style={{ fontWeight: 600 }}>{bill.details.departureTime}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>CLASS</div><div style={{ fontWeight: 600 }}>{bill.details.seatClass}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>PASSENGERS</div><div style={{ fontWeight: 600 }}>{bill.details.passengers || 1}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>AIRCRAFT</div><div style={{ fontWeight: 600 }}>{bill.details.aircraft}</div></div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 14 }}>💰 PRICING BREAKDOWN</div>
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {[
                  { label: 'Base Amount', amount: bill.pricing.baseAmount },
                  { label: `GST (${bill.pricing.gstRate})`, amount: bill.pricing.gst },
                  { label: 'Convenience Fee', amount: bill.pricing.convenienceFee },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid var(--border-light)', background: i % 2 === 0 ? 'var(--bg)' : 'white' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.label}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="grand-total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 18px', background: 'linear-gradient(135deg, #0d1b2e, #1a3a6e)', color: 'white' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>Grand Total</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>₹{bill.pricing.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bill-payment-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
              {/* FIX: Show "Pay at Hotel" instead of "COD" */}
              <div style={{ padding: '14px 18px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>PAYMENT METHOD</div>
                <div style={{ fontWeight: 700 }}>{paymentMethodLabel}</div>
              </div>

              {/* Payment Status */}
              <div style={{
                padding: '14px 18px',
                background: isPaid ? '#d1fae5' : isRefunded ? '#dbeafe' : isCancelled ? '#fee2e2' : '#fef3c7',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isPaid ? '#a7f3d0' : isRefunded ? '#bfdbfe' : isCancelled ? '#fecaca' : '#fde68a'}`
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>PAYMENT STATUS</div>
                <div style={{
                  fontWeight: 700,
                  color: isPaid ? 'var(--success)' : isRefunded ? '#1d4ed8' : isCancelled ? '#dc2626' : '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  {isPaid ? <FiCheckCircle size={14} /> : isRefunded ? <FiCheckCircle size={14} /> : isCancelled ? <FiCheckCircle size={14} /> : <FiClock size={14} />}
                  {paymentStatus}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>Thank you for choosing SkyStay! ✈️</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>For support: {bill.company.email} | {bill.company.phone}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 4 }}>This is a computer-generated bill and does not require a signature.</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        @media (max-width: 600px) {
          .bill-wrap { padding: 20px 16px !important; }
          .bill-header { padding: 20px 18px !important; }
          .bill-header-inner { flex-direction: column !important; }
          .bill-header-inner > div:last-child { text-align: left !important; }
          .bill-customer-grid { grid-template-columns: 1fr !important; }
          .bill-payment-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}