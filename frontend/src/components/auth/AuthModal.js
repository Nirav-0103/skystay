import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { MdFlight } from 'react-icons/md';

export default function AuthModal({ mode, onClose, onSwitch }) {
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Frontend Validations
    if (mode === 'register') {
      if (form.name.trim().length < 3) {
        return toast.error('Name must be at least 3 characters long');
      }
      if (form.phone && !/^\+?[0-9]{10,12}$/.test(form.phone.replace(/\s/g, ''))) {
        return toast.error('Please enter a valid phone number');
      }
    }

    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return toast.error('Please enter a valid email address');
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password);
        toast.success(`Welcome back, ${user.name?.split(' ')[0]}!`);
      } else {
        const user = await register(form.name, form.email, form.password, form.phone);
        toast.success(`Welcome to SkyStay, ${user.name?.split(' ')[0]}!`);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdFlight color="white" size={20} />
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>SkyStay</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
            <FiX size={20} />
          </button>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>
          {mode === 'login' ? 'Welcome back!' : 'Create account'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>
          {mode === 'login' ? 'Sign in to manage your bookings' : 'Start planning your perfect trip'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Full Name</label>
              <input className="input-field" type="text" placeholder="John Doe" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
          )}

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label">Email</label>
            <input className="input-field" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>

          {mode === 'register' && (
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Phone (Optional)</label>
              <input className="input-field" type="tel" placeholder="+91 98765 43210" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          )}

          <div className="input-group" style={{ marginBottom: 24 }}>
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input-field" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Link href="/forgot-password" onClick={onClose}
                  style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot Password?
                </Link>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 20 }} disabled={loading}>
            {loading ? <span className="loader" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => onSwitch(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
