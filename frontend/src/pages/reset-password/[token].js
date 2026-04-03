import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, { password });
      if (res.data.success) {
        setResetDone(true);
        toast.success('Password reset successful!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  if (resetDone) return (
    <>
      <Head><title>Password Reset Successful - SkyStay</title></Head>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--bg)' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '48px 32px', width: '100%', maxWidth: 450, textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
          <div style={{ width: 72, height: 72, background: 'var(--success)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <FiCheckCircle size={40} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>Password Reset! 🔓</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.95rem', lineHeight: 1.6 }}>
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <button onClick={() => router.push('/')} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Go to Login
          </button>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Head><title>Reset Password - SkyStay</title></Head>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--bg)' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '40px 32px', width: '100%', maxWidth: 450, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>New Password 🔒</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.95rem', lineHeight: 1.6 }}>
            Please enter your new password below. Make sure it's secure!
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input-field" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingLeft: 44, paddingRight: 44 }} />
                <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 32 }}>
              <label className="input-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input-field" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ paddingLeft: 44, paddingRight: 44 }} />
                <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Resetting password...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
