import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email });
      if (res.data.success) {
        setSubmitted(true);
        toast.success('Reset link sent!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <>
      <Head><title>Forgot Password - SkyStay</title></Head>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--bg)' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '40px 32px', width: '100%', maxWidth: 450, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
          
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, fontWeight: 600 }}>
            <FiArrowLeft /> Back to Login
          </Link>

          {!submitted ? (
            <>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>Forgot Password? 🔑</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.95rem', lineHeight: 1.6 }}>
                Enter your registered email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="input-group" style={{ marginBottom: 24 }}>
                  <label className="input-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input-field" type="email" placeholder="you@example.com" value={email}
                      onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: 44 }} />
                    <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 64, height: 64, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <FiCheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>Check your email!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.95rem', lineHeight: 1.6 }}>
                We've sent a password reset link to <strong>{email}</strong>. Please check your inbox (and spam folder).
              </p>
              <button onClick={() => setSubmitted(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                Didn't get the email? Try again
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
