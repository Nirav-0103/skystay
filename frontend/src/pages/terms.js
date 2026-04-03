import Head from 'next/head';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function Terms() {
  const sections = [
    { title: '1. Acceptance of Terms', content: 'By accessing or using SkyStay, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not use our services.' },
    { title: '2. Booking & Reservations', content: 'All bookings are subject to availability and admin confirmation. SkyStay acts as an intermediary between users and hotels/airlines. We reserve the right to cancel bookings in cases of fraud, incorrect pricing, or unavailability.' },
    { title: '3. Payment Terms', content: 'Payments are processed securely through Razorpay. By providing payment information, you authorize us to charge the specified amount. All prices include applicable taxes unless stated otherwise.' },
    { title: '4. Cancellation & Refunds', content: 'Cancellation policies vary by hotel and flight. Generally, cancellations made 24+ hours before check-in receive a full refund. Refunds are processed within 5-7 business days to the original payment method.' },
    { title: '5. User Responsibilities', content: 'You are responsible for providing accurate information when booking. You must be 18+ years old to make bookings. You agree not to misuse our platform or attempt to circumvent security measures.' },
    { title: '6. AI Services', content: 'Our AI features (chatbot, trip planner, natural language search) are provided for convenience and may not always be accurate. We recommend verifying important details independently.' },
    { title: '7. Limitation of Liability', content: 'SkyStay shall not be liable for indirect, incidental, or consequential damages. Our liability is limited to the amount paid for the specific booking in question.' },
    { title: '8. Governing Law', content: 'These terms are governed by Indian law. Disputes shall be resolved in the courts of Mumbai, Maharashtra, India.' },
  ];

  return (
    <>
      <Head><title>Terms of Service - SkyStay</title></Head>
      <Navbar />
      <div className="page-header">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: 8 }}>Terms of Service 📋</h1>
          <p style={{ opacity: 0.8 }}>Last updated: March 20, 2026</p>
        </div>
      </div>
      <div className="container" style={{ padding: '40px 24px 80px', maxWidth: 800 }}>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: i < sections.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 10, color: 'var(--primary)' }}>{s.title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.88rem' }}>{s.content}</p>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
}