import Head from 'next/head';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function PrivacyPolicy() {
  const sections = [
    { title: '1. Information We Collect', content: 'We collect information you provide directly to us, such as your name, email address, phone number, payment information, and travel preferences when you create an account or make a booking. We also collect information automatically when you use our services, including device information, IP address, browser type, and usage data.' },
    { title: '2. How We Use Your Information', content: 'We use the information we collect to: process bookings and payments, send booking confirmations and updates, provide customer support, personalize your travel recommendations using AI, improve our services, send promotional offers (with your consent), and comply with legal obligations.' },
    { title: '3. Payment Security', content: 'All payment transactions are processed through Razorpay, a PCI DSS compliant payment gateway. We do not store your complete card details on our servers. Your financial information is encrypted using 256-bit SSL technology.' },
    { title: '4. Information Sharing', content: 'We do not sell, trade, or rent your personal information to third parties. We may share information with hotels and airlines to complete your bookings, payment processors to handle transactions, and service providers who assist in our operations.' },
    { title: '5. AI Features & Data', content: 'Our AI chatbot and trip planner process your queries to provide personalized recommendations. Conversations may be used to improve our AI models. We use Claude AI (Anthropic) for our AI features, governed by their privacy policy.' },
    { title: '6. Cookies', content: 'We use cookies to maintain your session, remember your preferences, and analyze website traffic. You can control cookies through your browser settings. Disabling cookies may affect some features.' },
    { title: '7. Data Retention', content: 'We retain your personal information as long as your account is active. Booking records are kept for 7 years for accounting purposes. You may request deletion of your account and personal data at any time.' },
    { title: '8. Your Rights', content: 'You have the right to access, correct, or delete your personal information. You may opt out of marketing communications at any time. Contact us at privacy@skystay.com for any privacy-related requests.' },
    { title: '9. Contact Us', content: 'For privacy concerns, contact our Data Protection Officer at privacy@skystay.com or write to SkyStay Privacy Team, Mumbai, India 400001.' },
  ];

  return (
    <>
      <Head><title>Privacy Policy - SkyStay</title></Head>
      <Navbar />
      <div className="page-header">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: 8 }}>Privacy Policy 🔒</h1>
          <p style={{ opacity: 0.8 }}>Last updated: March 20, 2026</p>
        </div>
      </div>
      <div className="container" style={{ padding: '40px 24px 80px', maxWidth: 800 }}>
        <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 32, border: '1px solid rgba(26,110,245,0.15)' }}>
          <p style={{ color: 'var(--primary)', fontSize: '0.88rem', fontWeight: 500 }}>
            🛡️ At SkyStay, your privacy is our priority. This policy explains how we collect, use, and protect your personal information.
          </p>
        </div>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 10, color: 'var(--text-primary)' }}>{s.title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.88rem' }}>{s.content}</p>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
}