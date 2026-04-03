import Head from 'next/head';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import LoyaltyProgram from '../components/loyalty/LoyaltyProgram';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function LoyaltyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) { toast.error('Please sign in'); router.push('/'); }
  }, [user, loading]);

  if (!user) return null;

  return (
    <>
      <Head><title>SkyPoints Loyalty - SkyStay</title></Head>
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg, #0d1b2e, #1a3a6e)', padding: '40px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✨</div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, color: 'white', fontSize: 'clamp(1.5rem,3vw,2.2rem)', marginBottom: 8 }}>SkyPoints Rewards</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Earn points on every booking. Redeem for discounts, upgrades & more.</p>
        </div>
      </div>
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 800 }}>
        <LoyaltyProgram user={user} />
      </div>
      <Footer />
    </>
  );
}
