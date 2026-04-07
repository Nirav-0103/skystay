import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Script from 'next/script';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';
import { authAPI, uploadAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiBookmark, FiCamera, FiEdit2, FiX, FiCreditCard, FiStar, FiTrendingUp } from 'react-icons/fi';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', avatar: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/'); return; }
    setProfileForm({ 
      name: user.name || '', 
      phone: user.phone || '',
      avatar: user.avatar || ''
    });
  }, [user, authLoading]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Resizing and uploading image...');
    
    try {
      // Client-side compression using Canvas
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.src = objUrl;
      
      await new Promise(resolve => { img.onload = resolve; });
      
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob (compress to 80% JPEG)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
      URL.revokeObjectURL(objUrl);

      // Upload Compressed File
      const res = await uploadAPI.avatar(compressedFile);
      if (res.data.success) {
        setProfileForm(prev => ({ ...prev, avatar: res.data.url }));
        const updateRes = await authAPI.updateProfile({ ...profileForm, avatar: res.data.url });
        updateUser(updateRes.data.user);
        toast.success('Profile picture updated!', { id: toastId });
      }
    } catch (err) {
      console.error('Upload Error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image. Server may be down.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Remove profile picture?')) return;
    setUploading(true);
    const toastId = toast.loading('Removing image...');
    try {
      const updateRes = await authAPI.updateProfile({ ...profileForm, avatar: '' });
      if (updateRes.data.success) {
        setProfileForm(prev => ({ ...prev, avatar: '' }));
        updateUser(updateRes.data.user);
        toast.success('Profile picture removed!', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to remove image', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    setSaving(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    setSaving(false);
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!addMoneyAmount || addMoneyAmount <= 0) return toast.error('Enter a valid amount');
    setSaving(true);
    
    try {
      // 1. Create Order on Backend
      const { data } = await authAPI.createRazorpayOrder({ amount: Number(addMoneyAmount) });
      
      if (!data.success) {
        toast.error('Could not initiate payment');
        setSaving(false);
        return;
      }

      // 2. Configure Razorpay Pop-up
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: "INR",
        name: "SkyStay Premium",
        description: "Wallet Top-up",
        order_id: data.order.id,
        handler: async function (response) {
          const verifyToast = toast.loading('Verifying payment...');
          try {
            // 3. Verify Payment Signature
            const verifyRes = await authAPI.verifyRazorpayPayment({
              ...response,
              amount: Number(addMoneyAmount)
            });

            if (verifyRes.data.success) {
              updateUser({ ...user, walletBalance: verifyRes.data.walletBalance });
              toast.success(`₹${addMoneyAmount} successfully added to Wallet!`, { id: verifyToast });
              setAddMoneyAmount('');
            }
          } catch (error) {
            toast.error('Payment verification failed. If money was deducted, it will be refunded.', { id: verifyToast });
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ""
        },
        theme: {
          color: "#2563EB"
        },
        modal: {
          ondismiss: function() {
            setSaving(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response){
        toast.error('Payment failed: ' + response.error.description);
        setSaving(false);
      });
      
      paymentObject.open();

    } catch (err) {
      toast.error('Failed to connect to payment gateway');
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Head><title>My Profile - SkyStay</title></Head>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navbar />

      <div className="page-header">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => user.avatar && setShowPreview(true)}
                style={{ 
                  width: 80, height: 80, 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1.8rem', 
                  fontWeight: 800, 
                  color: 'white',
                  overflow: 'hidden',
                  border: '3px solid rgba(255,255,255,0.3)',
                  cursor: user.avatar ? 'pointer' : 'default'
                }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, position: 'absolute', bottom: -5, right: -25 }}>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'white', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    color: 'var(--primary)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'white';
                  }}
                  title="Update Picture"
                >
                  {uploading ? (
                    <div className="loader" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  ) : (
                    <FiCamera size={16} />
                  )}
                </button>
                {user.avatar && (
                  <button 
                    onClick={handleRemoveAvatar}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'white', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      color: '#ef4444', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.background = '#fef2f2';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = 'white';
                    }}
                    title="Remove Picture"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.5rem' }}>{user.name}</h1>
              <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 800 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32, background: 'white', borderRadius: 'var(--radius-full)', padding: 4, border: '1px solid var(--border)', width: 'fit-content' }}>
          {[
            { id: 'profile', label: 'Profile', icon: <FiUser size={15} /> },
            { id: 'wallet', label: 'SkyPay Wallet', icon: <FiCreditCard size={15} /> },
            { id: 'password', label: 'Password', icon: <FiLock size={15} /> },
            { id: 'bookings', label: 'Bookings', icon: <FiBookmark size={15} /> }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--radius-full)', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t.id ? 'var(--primary)' : 'transparent', color: tab === t.id ? 'white' : 'var(--text-secondary)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 32 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 24 }}>Personal Information</h2>
            <form onSubmit={saveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input className="input-field" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input className="input-field" value={user.email} disabled style={{ background: 'var(--bg)', cursor: 'not-allowed' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone</label>
                  <input className="input-field" placeholder="+91 98765 43210" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Member Since</label>
                  <input className="input-field" value={new Date(user.createdAt || Date.now()).toLocaleDateString()} disabled style={{ background: 'var(--bg)', cursor: 'not-allowed' }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {tab === 'password' && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700, margin: 0 }}>Change Password</h2>
              <Link href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Reset via Email?
              </Link>
            </div>
            <form onSubmit={changePassword} style={{ maxWidth: 400 }}>
              {[
                { label: 'Current Password', key: 'currentPassword' },
                { label: 'New Password', key: 'newPassword' },
                { label: 'Confirm New Password', key: 'confirmPassword' }
              ].map(field => (
                <div key={field.key} className="input-group" style={{ marginBottom: 16 }}>
                  <label className="input-label">{field.label}</label>
                  <input className="input-field" type="password" placeholder="••••••••"
                    value={passwordForm[field.key]} onChange={e => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })} required />
                </div>
              ))}
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {tab === 'wallet' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #1a6ef5 100%)', borderRadius: 'var(--radius-xl)', padding: 32, color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1, transform: 'scale(3)' }}>
                <FiCreditCard size={100} />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: '1rem', opacity: 0.8, marginBottom: 8 }}>SkyPay Balance</h3>
              <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'Syne', marginBottom: 24 }}>₹{(user.walletBalance || 0).toLocaleString()}</div>
              
              <form onSubmit={handleAddMoney} style={{ background: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 'var(--radius-lg)', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>Add Funds to Wallet</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="number" min="100" placeholder="Amount (e.g. 5000)" value={addMoneyAmount} onChange={e => setAddMoneyAmount(e.target.value)} required style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)', border: 'none', outline: 'none' }} />
                  <button type="submit" disabled={saving} style={{ padding: '10px 20px', background: '#fbbf24', color: '#0d1b2e', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer' }}>
                    {saving ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            </div>

            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 32, border: '1px solid var(--border)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiStar color="#fbbf24" fill="#fbbf24" /> Loyalty Tier
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user.loyaltyTier || 'Blue'} Member</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user.skyPoints || 0} SkyPoints</div>
                </div>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {user.loyaltyTier === 'Platinum' ? '💎' : user.loyaltyTier === 'Gold' ? '🥇' : user.loyaltyTier === 'Silver' ? '🥈' : '🔷'}
                </div>
              </div>
              <div style={{ background: 'var(--bg)', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', width: `${Math.min(100, ((user.skyPoints || 0) / 15000) * 100)}%` }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Earn 100 SkyPoints per ₹1000 spent. Next tier unlocks exclusive perks.</p>
            </div>
          </div>
        )}

        {tab === 'bookings' && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>View All Bookings</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Manage your hotel and flight bookings</p>
            <Link href="/bookings"><button className="btn btn-primary">Go to My Bookings</button></Link>
          </div>
        )}
      </div>

      <Footer />

      {/* Image Preview Modal */}
      {showPreview && user.avatar && (
        <div 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)', padding: 20
          }}
          onClick={() => setShowPreview(false)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img 
              src={user.avatar} 
              alt={user.name} 
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} 
            />
            <button 
              onClick={() => setShowPreview(false)}
              style={{
                position: 'absolute', top: -40, right: -40,
                background: 'white', border: 'none', width: 36, height: 36,
                borderRadius: '50%', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#111827'
              }}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
