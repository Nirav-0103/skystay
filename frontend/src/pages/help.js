import { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { FiChevronDown, FiChevronUp, FiMail, FiPhone, FiMessageCircle } from 'react-icons/fi';

const FAQS = [
  { q: 'How do I book a hotel on SkyStay?', a: 'Go to Hotels page → Search by city & dates → Select hotel → Choose room type → Click "Book Now" → Complete payment. Your booking request will be sent to admin for confirmation.' },
  { q: 'What payment methods are accepted?', a: 'We accept Credit/Debit Cards (Visa, Mastercard, RuPay), UPI (GPay, PhonePe, Paytm), Net Banking (all major banks), and Pay at Hotel option.' },
  { q: 'How long does booking confirmation take?', a: 'For online payments, confirmation is usually instant after admin approval (within 2-4 hours). For Pay at Hotel bookings, confirmation may take up to 24 hours.' },
  { q: 'Can I cancel my booking?', a: 'Yes! Go to My Bookings → Select booking → Click Cancel. Cancellation is free within 24 hours of booking. Refunds are processed within 5-7 business days.' },
  { q: 'How do I use the AI Trip Planner?', a: 'Click the "Generate My Trip Plan" button on the homepage → Enter your destination, dates, budget, and interests → Our AI creates a personalized luxury itinerary for you!' },
  { q: 'Is my payment information secure?', a: 'Absolutely! All payments are processed through Razorpay with 256-bit SSL encryption. We never store your card details.' },
  { q: 'Can I modify my booking dates?', a: 'Currently, date modification is not available directly. Please cancel and rebook, or contact our support team at support@skystay.com.' },
  { q: 'What is the AI Natural Language Search?', a: 'Type naturally like "Beach hotel in Goa under ₹10000 next weekend" and our AI will automatically search and filter results for you!' },
];

export default function HelpPage() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <Head><title>Help Center - SkyStay</title></Head>
      <Navbar />
      <div className="page-header">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: 8 }}>Help Center 💬</h1>
          <p style={{ opacity: 0.8 }}>Find answers to common questions</p>
        </div>
      </div>
      <div className="container" style={{ padding: '40px 24px 80px', maxWidth: 800 }}>
        {/* Contact Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
          {[
            { icon: <FiMail size={24} color="var(--primary)" />, title: 'Email Support', desc: 'support@skystay.com', sub: 'Reply within 2 hours', bg: 'var(--primary-light)' },
            { icon: <FiPhone size={24} color="var(--success)" />, title: 'Call Us', desc: '1800-123-4567', sub: '24/7 Available (Free)', bg: '#d1fae5' },
            { icon: <FiMessageCircle size={24} color="#8b5cf6" />, title: 'Live Chat', desc: 'Chat with SkyBot', sub: 'AI Assistant • Instant', bg: '#ede9fe' },
          ].map(c => (
            <div key={c.title} className="hover-lift" style={{ padding: 20, borderRadius: 'var(--radius-lg)', background: 'white', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, background: c.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{c.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.88rem' }}>{c.desc}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.4rem', marginBottom: 20 }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden', transition: 'all 0.2s' }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {faq.q}
                {open === i ? <FiChevronUp size={18} color="var(--primary)" /> : <FiChevronDown size={18} color="var(--text-muted)" />}
              </button>
              {open === i && (
                <div style={{ padding: '0 20px 18px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7, animation: 'fadeIn 0.2s ease', borderTop: '1px solid var(--border-light)' }}>
                  <br />{faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}