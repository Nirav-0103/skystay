import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { adminAPI, hotelAPI, flightAPI, bookingAPI, uploadAPI, authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import HotelFormModal from '../../components/admin/HotelFormModal';
import FlightFormModal from '../../components/admin/FlightFormModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import {
  FiUsers, FiBookmark, FiDollarSign, FiCheck, FiX, FiClock, FiEdit, FiTrash2,
  FiPlus, FiDownload, FiRefreshCw, FiShield, FiChevronRight, FiUpload, FiLink,
  FiImage, FiMenu, FiTrendingUp, FiGrid, FiAlertCircle, FiSearch, FiZap, FiCamera
} from 'react-icons/fi';
import { MdFlight, MdHotel } from 'react-icons/md';
import toast from 'react-hot-toast';

// ─── Removed 3D Components due to WebGL conflicts ──────────────────────────────────

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  confirmed:        { bg: '#d1fae5', color: '#065f46', dot: '#10b981', label: 'Confirmed' },
  pending:          { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b', label: 'Pending' },
  cancelled:        { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Cancelled' },
  completed:        { bg: '#e0e7ff', color: '#3730a3', dot: '#6366f1', label: 'Completed' },
  refund_requested: { bg: '#ffedd5', color: '#9a3412', dot: '#f97316', label: 'Refund Req.' },
  refunded:         { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', label: 'Refunded' },
};

function resolveStatus(booking) {
  if (booking.paymentMethod === 'cod' && booking.status === 'refund_requested') return 'cancelled';
  return booking.status;
}

function paymentLabel(method) {
  if (!method) return '—';
  if (method.toLowerCase() === 'cod') return 'Pay at Hotel';
  return method.charAt(0).toUpperCase() + method.slice(1);
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ booking }) {
  const status = resolveStatus(booking);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.7rem', fontWeight: 600,
      background: cfg.bg, color: cfg.color
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 32, gradient = 'linear-gradient(135deg,#6366f1,#8b5cf6)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, color: 'white', fontSize: size * 0.38, flexShrink: 0
    }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 14, padding: '16px',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'all 0.2s',
    }}
      className="stat-card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: accent + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent
        }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value ?? 0}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.65rem', color: accent, fontWeight: 700, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Table Styles ─────────────────────────────────────────────────────────────
const TH = { padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' };
const TD = { padding: '12px 16px', fontSize: '0.83rem', borderBottom: '1px solid var(--border-light)', color: 'var(--text-primary)', verticalAlign: 'middle' };

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 18, width: '100%', maxWidth: width,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        animation: 'modalIn 0.2s ease'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-card)', borderRadius: '18px 18px 0 0', zIndex: 1
        }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none',
            background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
          }}>
            <FiX size={14} />
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontSize: '0.88rem', outline: 'none',
  color: 'var(--text-primary)', background: 'var(--bg-card)',
  boxSizing: 'border-box', fontFamily: 'inherit',
  marginTop: 5
};

const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' };

// ─── USER / ADMIN FORM ────────────────────────────────────────────────────────
function UserFormModal({ isAdmin, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isAdmin) {
        await adminAPI.createAdmin(form);
        toast.success('Admin created!');
      } else {
        await adminAPI.createUser(form);
        toast.success('User created!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
    setSaving(false);
  };

  return (
    <Modal title={isAdmin ? '🛡️ Add Admin' : '👤 Add User'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {[
          ['name', 'Full Name', 'text', true],
          ['email', 'Email Address', 'email', true],
          ['password', 'Password', 'password', true],
          ['phone', 'Phone Number', 'tel', false],
        ].map(([key, label, type, req]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{label} {req && <span style={{ color: '#ef4444' }}>*</span>}</label>
            <input style={inputStyle} type={type} required={req} value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={label} />
          </div>
        ))}
        {isAdmin && (
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem',
            color: 'var(--text-secondary)', marginBottom: 14, display: 'flex', gap: 7, alignItems: 'flex-start'
          }}>
            <FiAlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            This user will have full admin access to the platform.
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: 9, border: '1.5px solid var(--border)',
            background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem'
          }}>Cancel</button>
          <button type="submit" disabled={saving} style={{
            flex: 2, padding: '10px', borderRadius: 9, border: 'none',
            background: isAdmin ? 'var(--primary)' : 'var(--text-primary)', color: 'white', fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: saving ? 0.7 : 1
          }}>
            {saving ? 'Creating…' : (isAdmin ? 'Create Admin' : 'Create User')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const Btn = ({ children, onClick, variant = 'ghost', disabled, style: s }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 8, fontWeight: 600,
    fontSize: '0.78rem', cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'opacity 0.15s', opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary:  { background: 'var(--primary)', color: 'white' },
    danger:   { background: '#fee2e2', color: '#dc2626' },
    success:  { background: '#d1fae5', color: '#065f46' },
    warning:  { background: '#fef3c7', color: '#92400e' },
    ghost:    { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    purple:   { background: '#7c3aed', color: 'white' },
    blue:     { background: '#eff6ff', color: '#2563eb' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...s }}>{children}</button>;
};

const SectionHeader = ({ title, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
    <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h1>
    {action}
  </div>
);

const Card = ({ children, style: s }) => (
  <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', ...s }}>
    {children}
  </div>
);

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [hotels, setHotels] = useState([]);
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [admins, setAdmins] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [actionLoading, setActionLoading] = useState(null);
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [editHotel, setEditHotel] = useState(null);
  const [editFlight, setEditFlight] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [revenueView, setRevenueView] = useState(6);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [syncingPoints, setSyncingPoints] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const adminFileInputRef = useRef(null);
  const [walletCreditUser, setWalletCreditUser] = useState(null); // {_id, name}
  const [walletCreditAmount, setWalletCreditAmount] = useState('');
  const [walletCreditNote, setWalletCreditNote] = useState('');
  const [walletCreditLoading, setWalletCreditLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) { router.push('/'); return; }
    loadData();
  }, [user, isAdmin, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, hotelsRes, flightsRes, bookingsRes, usersRes, pendingRes, adminsRes, refundsRes] = await Promise.all([
        adminAPI.getStats(),
        hotelAPI.getAll({ limit: 200 }),
        flightAPI.getAll({ limit: 200 }),
        bookingAPI.getAll({ limit: 200 }),
        adminAPI.getAllUsers({ limit: 200 }),
        adminAPI.getPendingBookings(),
        adminAPI.getAdmins(),
        adminAPI.getAllRefunds()
      ]);
      setStats(statsRes.data?.stats);
      setHotels(hotelsRes.data?.hotels || []);
      setFlights(flightsRes.data?.flights || []);
      setBookings(bookingsRes.data?.bookings || []);
      setUsers(usersRes.data?.users || []);
      setPendingBookings(pendingRes.data?.bookings || []);
      setAdmins(adminsRes.data?.admins || []);
      setRefunds(refundsRes.data?.refunds || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleSyncPoints = async () => {
    setSyncingPoints(true);
    try {
      const res = await adminAPI.syncSkyPoints();
      toast.success(res.data.message || 'SkyPoints synced successfully!');
      await loadData();
    } catch (err) {
      toast.error('Failed to sync SkyPoints');
    } finally {
      setSyncingPoints(false);
    }
  };

  const handleConfirm = async (id) => {
    // 1. Optimistic UI Update (Instant - Microsecond Execution)
    const backupPending = [...pendingBookings];
    const backupBookings = [...bookings];
    setPendingBookings(prev => prev.filter(b => b._id !== id));
    setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'confirmed' } : b));
    
    setActionLoading(id + '_confirm');
    try {
      // 2. Server Request in Background
      await adminAPI.confirmBooking(id);
      toast.success('Booking confirmed ✅');
      refreshUser();
    } catch { 
      // 3. Rollback if Server Fails
      setPendingBookings(backupPending);
      setBookings(backupBookings);
      toast.error('Failed to confirm'); 
    }
    setActionLoading(null);
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason (optional):') || 'Rejected by admin';
    
    // 1. Optimistic UI Update
    const backupPending = [...pendingBookings];
    setPendingBookings(prev => prev.filter(b => b._id !== id));
    
    setActionLoading(id + '_reject');
    try {
      // 2. Server Request in Background
      await adminAPI.rejectBooking(id, reason);
      toast.success('Booking rejected');
    } catch { 
      // 3. Rollback if Server Fails
      setPendingBookings(backupPending);
      toast.error('Failed to reject'); 
    }
    setActionLoading(null);
  };

  const handleDeleteHotel = async (id) => {
    if (!confirm('Delete this hotel? This cannot be undone.')) return;
    try { await hotelAPI.delete(id); toast.success('Hotel deleted'); setHotels(prev => prev.filter(h => h._id !== id)); }
    catch { toast.error('Failed to delete'); }
  };

  const handleDeleteFlight = async (id) => {
    if (!confirm('Delete this flight?')) return;
    try { await flightAPI.delete(id); toast.success('Flight deleted'); setFlights(prev => prev.filter(f => f._id !== id)); }
    catch { toast.error('Failed to delete'); }
  };

  const handleToggleUser = async (id) => {
    try {
      const res = await adminAPI.toggleUser(id);
      toast.success(res.data.message);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
    } catch { toast.error('Failed to update user'); }
  };

  const handleUpdateRefundStage = async (id, stage) => {
    setActionLoading(id + '_refund');
    try {
      await adminAPI.updateRefundStage(id, { stage });
      toast.success('Refund stage updated');
      loadData();
    } catch { toast.error('Failed to update refund'); }
    setActionLoading(null);
  };

  const handleRejectRefund = async (id) => {
    const reason = prompt('Reason for rejection:') || 'Rejected by admin';
    setActionLoading(id + '_reject_refund');
    try {
      await adminAPI.rejectRefund(id, { reason });
      toast.success('Refund request rejected');
      loadData();
    } catch { toast.error('Failed to reject refund'); }
    setActionLoading(null);
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u._id !== id));
      setAdmins(prev => prev.filter(a => a._id !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleSetDefaultAdmin = async (id) => {
    if (!confirm('Set this admin as default? This will remove default status from others.')) return;
    try {
      const res = await adminAPI.setAsDefault(id);
      if (res.data.success) {
        toast.success(res.data.message);
        loadData(); // Refresh to get updated default status
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to set default admin'); }
  };

  const handleResetPassword = async (id, name) => {
    if (!confirm(`Send a password reset email to ${name}?`)) return;
    try {
      const res = await adminAPI.sendResetEmail(id);
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  const handleAdminAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const toastId = toast.loading('Uploading profile picture...');
    try {
      const res = await uploadAPI.avatar(file);
      if (res.data.success) {
        await authAPI.updateProfile({ avatar: res.data.url });
        await refreshUser();
        toast.success('Profile picture updated!', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to upload image', { id: toastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAdminAvatar = async () => {
    if (!confirm('Remove profile picture?')) return;
    setUploadingAvatar(true);
    const toastId = toast.loading('Removing picture...');
    try {
      await authAPI.updateProfile({ avatar: '' });
      await refreshUser();
      toast.success('Profile picture removed!', { id: toastId });
    } catch (err) {
      toast.error('Failed to remove image', { id: toastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleExportCSV = async (type) => {
    setExportingCSV(type);
    try { await adminAPI.exportCSV(type); toast.success(`${type} CSV downloaded!`); }
    catch { toast.error('Export failed'); }
    setExportingCSV(false);
  };

  const handleWalletCredit = async (e) => {
    e.preventDefault();
    if (!walletCreditUser || !walletCreditAmount || Number(walletCreditAmount) <= 0) return;
    setWalletCreditLoading(true);
    try {
      const res = await adminAPI.addWalletCredit(walletCreditUser._id, {
        amount: Number(walletCreditAmount),
        note: walletCreditNote
      });
      toast.success(res.data.message);
      setUsers(prev => prev.map(u => u._id === walletCreditUser._id
        ? { ...u, walletBalance: res.data.newBalance }
        : u
      ));
      setWalletCreditUser(null);
      setWalletCreditAmount('');
      setWalletCreditNote('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to credit wallet');
    }
    setWalletCreditLoading(false);
  };

  const handleTabChange = (tabId) => { setActiveTab(tabId); setSidebarOpen(false); };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loader" />
      </div>
    </>
  );

  const revenueData = stats?.monthlyRevenue?.slice(-revenueView) || [];

  const statCards = [
    { label: 'Total Users',    value: stats?.totalUsers,    icon: <FiUsers size={16} />,      accent: '#6366f1' },
    { label: 'Admins',         value: stats?.totalAdmins,   icon: <FiShield size={16} />,     accent: '#8b5cf6' },
    { label: 'Hotels',         value: stats?.totalHotels,   icon: <MdHotel size={16} />,      accent: '#0ea5e9' },
    { label: 'Flights',        value: stats?.totalFlights,  icon: <MdFlight size={16} />,     accent: '#06b6d4' },
    { label: 'Total Bookings', value: stats?.totalBookings, icon: <FiBookmark size={16} />,   accent: '#10b981' },
    { label: 'Total Revenue',  value: `₹${((stats?.totalRevenue || 0) / 1000).toFixed(0)}k`,  icon: <FiDollarSign size={16} />, accent: '#f59e0b' },
    { label: 'Pending Bookings', value: stats?.pendingBookings || 0, icon: <FiClock size={16} />, accent: '#ef4444' },
    { label: 'Pending Refunds',  value: stats?.pendingRefunds || 0,  icon: <FiRefreshCw size={16} />, accent: '#f97316' },
  ];

  const sidebarItems = [
    { id: 'overview',  icon: <FiGrid size={14} />,       label: 'Overview' },
    { id: 'pending',   icon: <FiClock size={14} />,      label: 'Pending', badge: pendingBookings.length },
    { id: 'hotels',    icon: <MdHotel size={14} />,      label: 'Hotels' },
    { id: 'flights',   icon: <MdFlight size={14} />,     label: 'Flights' },
    { id: 'bookings',  icon: <FiBookmark size={14} />,   label: 'Bookings' },
    { id: 'refunds',   icon: <FiRefreshCw size={14} />,  label: 'Refunds', badge: refunds.filter(r => r.refund?.status === 'pending').length },
    { id: 'users',     icon: <FiUsers size={14} />,      label: 'Users' },
    { id: 'admins',    icon: <FiShield size={14} />,     label: 'Admins' },
    { id: 'revenue',   icon: <FiTrendingUp size={14} />, label: 'Revenue' },
  ];

  return (
    <>
      <Head><title>Admin — SkyStay</title></Head>
      <Navbar />

      <style jsx global>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: none; } }
        .admin-row:hover td { background: var(--bg-secondary) !important; }
        .sidebar-item { transition: all 0.12s; }
        .sidebar-item:hover { background: var(--bg-secondary) !important; }
        .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .admin-layout { 
          display: flex; 
          min-height: 100vh; 
          background: var(--bg); 
          padding: 110px 24px 24px; 
          gap: 24px;
          max-width: 1600px;
          margin: 0 auto;
        }
        .admin-sidebar {
          width: 260px; flex-shrink: 0;
          background: var(--bg-card); color: var(--text-primary);
          position: sticky; top: 110px;
          height: calc(100vh - 134px); overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: 20px;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(.4,0,.2,1);
          z-index: 200;
        }
        .admin-main { flex: 1; padding: 0; min-width: 0; background: transparent; }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .mobile-topbar { display: none; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: var(--bg-overlay); backdrop-filter: blur(2px); z-index: 199; }
        .sidebar-close-btn { display: none; }
        
        /* 📱 iPad Mini & iPad Air (Portrait & Landscape optimization) */
        @media (max-width: 1024px) {
          .admin-layout { padding: 110px 20px 20px !important; gap: 20px !important; }
          .admin-sidebar { 
            position: fixed !important; 
            top: 0 !important; 
            left: 0 !important; 
            height: 100vh !important; 
            width: 280px !important;
            border-radius: 0 !important;
            transform: translateX(-100%); 
            z-index: 1000 !important; 
            box-shadow: 20px 0 50px rgba(0,0,0,0.2) !important;
          }
          .admin-sidebar.open { transform: translateX(0) !important; }
          .sidebar-overlay.open { display: block !important; }
          .sidebar-close-btn { display: flex !important; }
          .mobile-topbar { 
            display: flex !important; 
            align-items: center; 
            justify-content: space-between; 
            padding: 12px 20px; 
            background: var(--bg-card); 
            border-radius: 16px;
            margin-bottom: 20px;
            border: 1px solid var(--border);
            position: sticky; 
            top: 110px; 
            z-index: 40; 
            box-shadow: var(--shadow-sm);
          }
          .admin-main { padding: 0 !important; }
          .stat-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 14px !important; }
        }

        @media (max-width: 768px) {
          .admin-layout { padding: 90px 16px 16px !important; }
          .mobile-topbar { top: 90px; }
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
        }

        @media (max-width: 480px) {
          .admin-layout { padding: 80px 12px 12px !important; gap: 16px !important; }
          .mobile-topbar { top: 80px; }
          .stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            background: 'var(--bg-secondary)', border: 'none', borderRadius: 10,
            color: 'var(--text-primary)', cursor: 'pointer', padding: '8px',
            display: 'flex', alignItems: 'center', transition: 'all 0.2s'
          }}>
            <FiMenu size={20} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1 }}>Admin Portal</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div style={{ padding: sidebarOpen ? '20px 18px 14px' : '12px 18px 14px', position: 'relative' }}>
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="sidebar-close-btn"
              style={{ 
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'var(--bg-secondary)', 
                border: 'none', 
                borderRadius: '50%', 
                color: 'var(--text-primary)', 
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                zIndex: 100,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            >
              <FiX size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ position: 'relative' }} className="group">
                <Avatar name={user?.name} size={42} gradient="linear-gradient(135deg,#2563eb,#3b82f6)" />
                {user?.avatar && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemoveAdminAvatar(); }}
                      style={{
                        position: 'absolute', inset: 0, background: 'var(--bg-overlay)',
                        color: 'white', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s'
                      }}
                      className="group-hover:opacity-100"
                      title="Remove Picture"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => adminFileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--bg-card)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                    color: 'var(--primary)', zIndex: 1
                  }}
                >
                  {uploadingAvatar ? (
                    <div className="loader" style={{ width: 8, height: 8, borderWidth: 1 }} />
                  ) : (
                    <FiCamera size={10} />
                  )}
                </button>
                <input 
                  type="file" 
                  ref={adminFileInputRef} 
                  onChange={handleAdminAvatarUpload} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Admin Panel</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{user?.name}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              SkyStay Navigation
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '0 14px 10px' }} />

          <nav style={{ padding: '4px 10px' }}>
            {sidebarItems.map(item => {
              const active = activeTab === item.id;
              return (
                <button key={item.id} className="sidebar-item" onClick={() => handleTabChange(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                  padding: '9px 10px', marginBottom: 2, borderRadius: 9,
                  background: active ? 'var(--primary-light)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontWeight: active ? 600 : 500, fontSize: '0.83rem',
                }}>
                  <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge > 0 && (
                    <span style={{
                      background: '#ef4444', color: 'white',
                      borderRadius: 20, padding: '1px 7px', fontSize: '0.62rem', fontWeight: 700
                    }}>{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ height: 1, background: 'var(--border)', margin: '10px 14px' }} />

          <div style={{ padding: '0 10px 20px' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2 }}>Export CSV</div>
            {['bookings', 'users', 'revenue'].map(t => (
              <button key={t} onClick={() => handleExportCSV(t)} disabled={!!exportingCSV} style={{
                display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                padding: '7px 10px', background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: exportingCSV === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', borderRadius: 7, marginBottom: 4,
                fontSize: '0.75rem', fontWeight: 500
              }}>
                <FiDownload size={11} />
                {exportingCSV === t ? 'Exporting…' : `Export ${t.charAt(0).toUpperCase() + t.slice(1)}`}
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="admin-main">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && stats && (
            <div style={{ animation: 'fadeInUp 0.4s ease' }}>
              {/* Premium Dashboard Header Banner */}
              <div style={{
                position: 'relative',
                marginBottom: 28,
                padding: '36px 40px',
                borderRadius: 24,
                background: 'linear-gradient(135deg, var(--primary) 0%, #0f2347 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 12px 32px rgba(26, 110, 245, 0.2)',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8, opacity: 0.85 }}>
                    ✦ SkyStay Admin Portal
                  </div>
                  <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.2rem', fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                    Dashboard Overview
                  </h1>
                </div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <button 
                    onClick={loadData} 
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.12)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: '10px 18px', 
                      borderRadius: 12, 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                  >
                    <FiRefreshCw size={14} /> Refresh Data
                  </button>
                </div>
                {/* Decorative background elements */}
                <div style={{ position: 'absolute', right: '-5%', top: '-30%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', zIndex: 1, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', right: '15%', bottom: '-20%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)', zIndex: 1, pointerEvents: 'none' }} />
              </div>

              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <StatCard label="Total Revenue" value={`₹${stats.totalRevenue?.toLocaleString()}`} icon={<FiDollarSign size={18}/>} accent="#10b981" sub={`Today: ₹${stats.todayRevenue?.toLocaleString()}`} />
                <StatCard label="Total Bookings" value={stats.totalBookings} icon={<FiBookmark size={18}/>} accent="#1a6ef5" sub={`Today: ${stats.todayBookings}`} />
                <StatCard label="Active Users" value={stats.totalUsers} icon={<FiUsers size={18}/>} accent="#7c3aed" />
                <StatCard label="Pending Refunds" value={refunds.filter(r => r.refund?.status === 'pending').length} icon={<FiAlertCircle size={18}/>} accent="#ef4444" />
              </div>

              {/* Charts Row 1 — 2D Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 20 }}>
                {/* Revenue Trend Area Chart */}
                <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>Revenue Growth</h3>
                    <select value={revenueView} onChange={e => setRevenueView(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.75rem', outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value={6}>Last 6 Months</option>
                      <option value={12}>Last 12 Months</option>
                    </select>
                  </div>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.monthlyRevenue?.slice(-revenueView) || []}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1a6ef5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#1a6ef5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-md)', fontSize: 12, background: 'var(--bg-card)' }} formatter={val => [`₹${val.toLocaleString()}`, 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#1a6ef5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Booking Distribution Pie Chart */}
                <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 20 }}>Booking Distribution</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Hotels', value: stats.bookingTypeStats?.hotel },
                            { name: 'Flights', value: stats.bookingTypeStats?.flight }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#1a6ef5" />
                          <Cell fill="#fbbf24" />
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-md)', fontSize: 12, background: 'var(--bg-card)' }} />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ color: 'var(--text-primary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Advanced Analytics Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 20 }}>
                {/* Top Destinations Bar Chart */}
                <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 20 }}>Top 5 Destinations (by Booking)</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.topDestinations || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                        <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <Tooltip cursor={{ fill: 'var(--bg-secondary)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-md)', fontSize: 12, background: 'var(--bg-card)' }} />
                        <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Revenue by Category Bar Chart */}
                <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 20 }}>Revenue by Category</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.categoryRevenue || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                        <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => v?.charAt(0).toUpperCase() + v?.slice(1)} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip cursor={{ fill: 'var(--bg-secondary)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-md)', fontSize: 12, background: 'var(--bg-card)' }} formatter={val => `₹${val.toLocaleString()}`} />
                        <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Removed 3D Charts Row */}

              {/* Inventory Overview Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
                <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 20 }}>Inventory Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 14, border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MdHotel size={16} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Hotels</span>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.totalHotels}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Active properties</div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 14, border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MdFlight size={16} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Flights</span>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.totalFlights}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Active routes</div>
                    </div>
                  </div>
                </div>

                {/* Platform Status */}
                <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 20 }}>Platform Health</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'API Server', status: 'Healthy', color: '#10b981' },
                      { label: 'Database', status: 'Connected', color: '#10b981' },
                      { label: 'Mail Service', status: 'Active', color: '#10b981' },
                      { label: 'AI Planner', status: 'Online', color: '#10b981' }
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Bookings Table (was here before) */}
              <Card>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Recent Bookings</span>
                  <button onClick={() => handleTabChange('bookings')} style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
                </div>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
                    <thead><tr>{['ID', 'Type', 'User', 'Property', 'Status', 'Amount', 'Payment', 'Date'].map((h, i) => <th key={i} style={{ ...TH, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {bookings.slice(0, 8).map(b => (
                        <tr key={b._id} className="admin-row">
                          <td style={{ ...TD, color: 'var(--text-primary)' }}><code style={{ fontSize: '0.7rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 5, color: 'var(--text-secondary)' }}>{b.bookingId || b._id?.slice(-6)}</code></td>
                          <td style={{ ...TD, color: 'var(--text-secondary)' }}><span style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{b.bookingType === 'hotel' ? '🏨' : '✈️'} {b.bookingType}</span></td>
                          <td style={TD}><span style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-primary)' }}>{b.user?.name || '—'}</span></td>
                          <td style={{ ...TD, color: 'var(--text-secondary)' }}>{b.hotel?.name || b.flight?.flightNumber || '—'}</td>
                          <td style={TD}><StatusBadge booking={b} /></td>
                          <td style={{ ...TD, fontWeight: 700, color: 'var(--text-primary)' }}>₹{b.totalAmount?.toLocaleString('en-IN')}</td>
                          <td style={TD}><span style={{ fontSize: '0.72rem', background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: 5, color: 'var(--text-secondary)', fontWeight: 600 }}>{paymentLabel(b.paymentMethod)}</span></td>
                          <td style={{ ...TD, color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ── PENDING ── */}
          {activeTab === 'pending' && (
            <>
              <SectionHeader title={`Pending Approvals (${pendingBookings.length})`} />
              {pendingBookings.length === 0 ? (
                <Card style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>All caught up!</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginTop: 4 }}>No pending bookings to review</div>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingBookings.map(b => (
                    <Card key={b._id} style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                        {b.hotel?.images?.[0] && (
                          <img src={b.hotel.images[0]} alt="" style={{ width: 60, height: 46, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }}
                            onError={e => e.target.style.display = 'none'} />
                        )}
                        <div style={{ flex: 1, minWidth: 150 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{b.hotel?.name || b.flight?.flightNumber || 'Booking'}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 2 }}>{b.user?.name} · {b.user?.email}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.73rem', marginTop: 2 }}>
                            {b.bookingType === 'hotel' ? `${b.nights || 0} nights · ${b.guests} guests` : `${b.passengers} pax · ${b.seatClass}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>₹{b.totalAmount?.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>{paymentLabel(b.paymentMethod)}</div>
                          <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                            <Btn variant="success" onClick={() => handleConfirm(b._id)} disabled={!!actionLoading}>
                              <FiCheck size={12} /> Approve
                            </Btn>
                            <Btn variant="danger" onClick={() => handleReject(b._id)} disabled={!!actionLoading}>
                              <FiX size={12} /> Reject
                            </Btn>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── HOTELS ── */}
          {activeTab === 'hotels' && (
            <>
              <SectionHeader title={`Hotels (${hotels.length})`} action={
                <Btn variant="primary" onClick={() => { setEditHotel(null); setShowHotelForm(true); }}>
                  <FiPlus size={13} /> Add Hotel
                </Btn>
              } />
              <Card>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
                    <thead><tr>{['', 'Name', 'City', 'Category', 'Price/Night', 'Rating', 'Status', ''].map((label, i) => <th key={i} style={{ ...TH, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{label}</th>)}</tr></thead>
                    <tbody>
                      {hotels.map(h => (
                        <tr key={h._id} className="admin-row">
                          <td style={{ ...TD, width: 52 }}>
                            {h.images?.[0] ? (
                              <img src={h.images[0]} alt="" style={{ width: 44, height: 34, borderRadius: 7, objectFit: 'cover', display: 'block' }}
                                onError={e => { e.target.style.display = 'none'; }} />
                            ) : (
                              <div style={{ width: 44, height: 34, borderRadius: 7, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiImage size={14} color="var(--text-muted)" />
                              </div>
                            )}
                          </td>
                          <td style={{ ...TD, fontWeight: 600, color: 'var(--text-primary)' }}>{h.name}</td>
                          <td style={{ ...TD, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{h.city}</td>
                          <td style={TD}>
                            <span style={{
                              padding: '2px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize',
                              background: h.category === 'luxury' ? '#fef9c3' : h.category === 'budget' ? '#d1fae5' : '#dbeafe',
                              color: h.category === 'luxury' ? '#92400e' : h.category === 'budget' ? '#065f46' : '#1e40af'
                            }}>{h.category}</span>
                          </td>
                          <td style={{ ...TD, fontWeight: 600, color: 'var(--text-primary)' }}>₹{Number(h.pricePerNight || 0).toLocaleString('en-IN')}</td>
                          <td style={{ ...TD, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>⭐ {Number(h.rating || 0).toFixed(1)}</td>
                          <td style={TD}>
                            <span style={{
                              padding: '2px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600,
                              background: h.isActive ? '#d1fae5' : '#fee2e2',
                              color: h.isActive ? '#065f46' : '#991b1b'
                            }}>{h.isActive ? 'Active' : 'Inactive'}</span>
                          </td>
                          <td style={TD}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <Btn variant="blue" onClick={() => { setEditHotel(h); setShowHotelForm(true); }}><FiEdit size={11} /></Btn>
                              <Btn variant="danger" onClick={() => handleDeleteHotel(h._id)}><FiTrash2 size={11} /></Btn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ── FLIGHTS ── */}
          {activeTab === 'flights' && (
            <>
              <SectionHeader title={`Flights (${flights.length})`} action={
                <Btn variant="primary" onClick={() => { setEditFlight(null); setShowFlightForm(true); }}>
                  <FiPlus size={13} /> Add Flight
                </Btn>
              } />
              <Card>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                    <thead><tr>{['Flight No', 'Airline', 'Route', 'Departure', 'Duration', 'Base Price', ''].map((h, i) => <th key={i} style={{ ...TH, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {flights.map(f => (
                        <tr key={f._id} className="admin-row">
                          <td style={{ ...TD, fontWeight: 700, color: 'var(--primary)', fontSize: '0.83rem' }}>{f.flightNumber}</td>
                          <td style={{ ...TD, color: 'var(--text-primary)' }}>{f.airline}</td>
                          <td style={{ ...TD, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.83rem' }}>{f.from} → {f.to}</td>
                          <td style={{ ...TD, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{f.departureTime}</td>
                          <td style={{ ...TD, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{f.duration}</td>
                          <td style={{ ...TD, fontWeight: 600, color: 'var(--text-primary)' }}>₹{f.basePrice?.toLocaleString('en-IN')}</td>
                          <td style={TD}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <Btn variant="blue" onClick={() => { setEditFlight(f); setShowFlightForm(true); }}><FiEdit size={11} /></Btn>
                              <Btn variant="danger" onClick={() => handleDeleteFlight(f._id)}><FiTrash2 size={11} /></Btn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ── ALL BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <>
              <SectionHeader title={`All Bookings (${bookings.length})`} action={
                <Btn variant="success" onClick={() => handleExportCSV('bookings')}><FiDownload size={12} /> Export CSV</Btn>
              } />
              <Card>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                    <thead><tr>{['ID', 'Type', 'User', 'Property', 'Status', 'Amount', 'Payment', 'Date'].map(h => <th key={h} style={{ ...TH, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b._id} className="admin-row">
                          <td style={{ ...TD, color: 'var(--text-primary)' }}><code style={{ fontSize: '0.7rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 5, color: 'var(--text-secondary)' }}>{b.bookingId || b._id?.slice(-6)}</code></td>
                          <td style={{ ...TD, color: 'var(--text-secondary)' }}><span style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{b.bookingType === 'hotel' ? '🏨' : '✈️'} {b.bookingType}</span></td>
                          <td style={TD}>
                            <div style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-primary)' }}>{b.user?.name || '—'}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.user?.email}</div>
                          </td>
                          <td style={{ ...TD, color: 'var(--text-secondary)' }}>{b.hotel?.name || b.flight?.flightNumber || '—'}</td>
                          <td style={TD}><StatusBadge booking={b} /></td>
                          <td style={{ ...TD, fontWeight: 700, color: 'var(--text-primary)' }}>₹{b.totalAmount?.toLocaleString('en-IN')}</td>
                          <td style={TD}><span style={{ fontSize: '0.72rem', background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: 5, color: 'var(--text-secondary)', fontWeight: 600 }}>{paymentLabel(b.paymentMethod)}</span></td>
                          <td style={{ ...TD, color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ── REFUNDS ── */}
          {activeTab === 'refunds' && (
            <>
              <SectionHeader title={`Refund Requests (${refunds.length})`} />
              <Card>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                    <thead>
                      <tr>
                        {['Booking ID', 'User', 'Amount', 'Status', 'Current Stage', 'Requested', 'Actions'].map(h => <th key={h} style={{ ...TH, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.length === 0 ? (
                        <tr><td colSpan="7" style={{ ...TD, textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No refund requests found</td></tr>
                      ) : (
                        refunds.map(r => (
                          <tr key={r._id} className="admin-row">
                            <td style={{ ...TD, color: 'var(--text-primary)' }}><code style={{ fontSize: '0.7rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 5, color: 'var(--text-secondary)' }}>{r.bookingId}</code></td>
                            <td style={TD}>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{r.user?.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.user?.email}</div>
                            </td>
                            <td style={{ ...TD, fontWeight: 700, color: 'var(--text-primary)' }}>₹{r.refund?.amount?.toLocaleString('en-IN')}</td>
                            <td style={TD}>
                              <span style={{
                                padding: '2px 9px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                                background: r.refund?.status === 'completed' ? '#d1fae5' : r.refund?.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                color: r.refund?.status === 'completed' ? '#065f46' : r.refund?.status === 'rejected' ? '#991b1b' : '#92400e'
                              }}>{r.refund?.status}</span>
                            </td>
                            <td style={TD}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 60, height: 6, background: 'var(--bg-secondary)', borderRadius: 10, overflow: 'hidden' }}>
                                  <div style={{ width: `${(r.refund?.currentStage + 1) * 25}%`, height: '100%', background: 'var(--primary)' }} />
                                </div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Stage {r.refund?.currentStage + 1}/4</span>
                              </div>
                            </td>
                            <td style={{ ...TD, color: 'var(--text-muted)', fontSize: '0.72rem' }}>{new Date(r.refund?.requestedAt).toLocaleDateString()}</td>
                            <td style={TD}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {r.refund?.status !== 'completed' && r.refund?.status !== 'rejected' && (
                                  <>
                                    <select 
                                      style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                      value={r.refund?.currentStage}
                                      onChange={(e) => handleUpdateRefundStage(r._id, Number(e.target.value))}
                                      disabled={actionLoading === r._id + '_refund'}
                                    >
                                      <option value="0">Requested</option>
                                      <option value="1">Approved</option>
                                      <option value="2">Processing</option>
                                      <option value="3">Completed</option>
                                    </select>
                                    <Btn variant="danger" onClick={() => handleRejectRefund(r._id)} disabled={actionLoading === r._id + '_reject_refund'}>
                                      Reject
                                    </Btn>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <>
              <SectionHeader title={`Users (${users.length})`} action={
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Btn 
                    onClick={handleSyncPoints} 
                    variant="ghost" 
                    disabled={syncingPoints}
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <FiRefreshCw size={13} style={{ animation: syncingPoints ? 'spin 1s linear infinite' : 'none' }} />
                    {syncingPoints ? 'Syncing...' : 'Sync Points'}
                  </Btn>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      style={{ ...inputStyle, width: 220, paddingLeft: 34, marginTop: 0, background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} 
                    />
                    <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <Btn variant="success" onClick={() => handleExportCSV('users')}><FiDownload size={12} /> Export</Btn>
                  <Btn variant="primary" onClick={() => setShowUserModal(true)}><FiPlus size={13} /> Add User</Btn>
                </div>
              } />
              <Card>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                    <thead><tr>{['User', 'Contact', 'SkyPoints', 'Bookings', 'Spent', 'Status', 'Joined', ''].map(h => <th key={h} style={{ ...TH, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {users.filter(u => 
                        u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                        u.email?.toLowerCase().includes(userSearch.toLowerCase())
                      ).map(u => (
                        <tr key={u._id} className="admin-row">
                          <td style={TD}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar name={u.name} size={30} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-primary)' }}>{u.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {u._id.slice(-6).toUpperCase()}</div>
                              </div>
                            </div>
                          </td>
                          <td style={TD}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>{u.email}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{u.phone || 'No phone'}</div>
                          </td>
                          <td style={TD}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: 'var(--primary)' }}>
                              <FiZap size={12} fill="var(--primary)" /> {u.skyPoints || 0}
                            </div>
                          </td>
                          <td style={{ ...TD, color: 'var(--primary)' }}><span style={{ fontWeight: 700 }}>{u.bookingCount || 0}</span></td>
                          <td style={{ ...TD, fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-primary)' }}>₹{(u.totalSpent || 0).toLocaleString('en-IN')}</td>
                          <td style={TD}>
                            <span style={{
                              padding: '2px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600,
                              background: u.isActive ? '#d1fae5' : '#fee2e2',
                              color: u.isActive ? '#065f46' : '#991b1b'
                            }}>{u.isActive ? 'Active' : 'Inactive'}</span>
                          </td>
                          <td style={{ ...TD, color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                          <td style={TD}>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              <Btn variant="success" onClick={() => { setWalletCreditUser(u); setWalletCreditAmount(''); setWalletCreditNote(''); }} style={{ padding: '4px 8px' }} title="Add Wallet Credit">
                                💳
                              </Btn>
                              <Btn variant="blue" onClick={() => handleResetPassword(u._id, u.name)} style={{ padding: '4px 8px' }} title="Reset Password">
                                <FiRefreshCw size={11} />
                              </Btn>
                              <Btn variant={u.isActive ? 'warning' : 'success'} onClick={() => handleToggleUser(u._id)} style={{ padding: '4px 8px' }}>
                                {u.isActive ? 'Suspend' : 'Activate'}
                              </Btn>
                              <Btn variant="danger" onClick={() => handleDeleteUser(u._id)} style={{ padding: '4px 8px' }}><FiTrash2 size={11} /></Btn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ── WALLET CREDIT MODAL ── */}
          {walletCreditUser && (
            <Modal title={`💳 Add Wallet Credit — ${walletCreditUser.name}`} onClose={() => setWalletCreditUser(null)}>
              <form onSubmit={handleWalletCredit}>
                <div style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#065f46', fontWeight: 600 }}>
                  ⚡ Admin Override — No payment gateway required. Amount credited instantly.
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Amount (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input style={inputStyle} type="number" min="1" placeholder="e.g. 50000" value={walletCreditAmount} onChange={e => setWalletCreditAmount(e.target.value)} required autoFocus />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Note / Reason (optional)</label>
                  <input style={inputStyle} type="text" placeholder="e.g. Refund compensation, Promo credit..." value={walletCreditNote} onChange={e => setWalletCreditNote(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setWalletCreditUser(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>Cancel</button>
                  <button type="submit" disabled={walletCreditLoading} style={{ flex: 2, padding: '10px', borderRadius: 9, border: 'none', background: '#10b981', color: 'white', fontWeight: 700, cursor: walletCreditLoading ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: walletCreditLoading ? 0.7 : 1 }}>
                    {walletCreditLoading ? 'Crediting...' : `💳 Credit ₹${walletCreditAmount || '0'} to Wallet`}
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* ── ADMINS ── */}
          {activeTab === 'admins' && (
            <>
              <SectionHeader title={`Admins (${admins.length})`} action={
                <Btn variant="purple" onClick={() => setShowAdminModal(true)}><FiPlus size={13} /> Add Admin</Btn>
              } />
              <Card>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
                    <thead><tr>{['Admin', 'Email', 'Phone', 'Joined', ''].map(h => <th key={h} style={{ ...TH, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {admins.map(a => (
                        <tr key={a._id} className="admin-row">
                          <td style={TD}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar name={a.name} size={30} gradient="linear-gradient(135deg,#7c3aed,#a78bfa)" />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-primary)' }}>
                                  {a.name}
                                  {a.isDefaultAdmin && (
                                    <span style={{ marginLeft: 6, fontSize: '0.6rem', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 4, fontWeight: 800, verticalAlign: 'middle', border: '1px solid #fde68a' }}>DEFAULT</span>
                                  )}
                                </div>
                                {a._id === user?._id && <span style={{ fontSize: '0.65rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>You</span>}
                              </div>
                            </div>
                          </td>
                          <td style={{ ...TD, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{a.email}</td>
                          <td style={{ ...TD, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{a.phone || '—'}</td>
                          <td style={{ ...TD, color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(a.createdAt).toLocaleDateString('en-IN')}</td>
                          <td style={TD}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <Btn variant="blue" onClick={() => handleResetPassword(a._id, a.name)} style={{ padding: '4px 8px' }} title="Reset Password">
                                <FiRefreshCw size={11} />
                              </Btn>
                              {!a.isDefaultAdmin && (
                                <Btn variant="purple" onClick={() => handleSetDefaultAdmin(a._id)} style={{ padding: '4px 8px' }}>
                                  <FiShield size={11} /> Set Default
                                </Btn>
                              )}
                              {a._id !== user?._id && !a.isDefaultAdmin && (
                                <Btn variant="danger" onClick={() => handleDeleteUser(a._id)} style={{ padding: '4px 8px' }}>
                                  <FiTrash2 size={11} /> Remove
                                </Btn>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ── REVENUE ── */}
          {activeTab === 'revenue' && (
            <>
              <SectionHeader title="Revenue Analytics" action={
                <Btn variant="success" onClick={() => handleExportCSV('revenue')}><FiDownload size={12} /> Export CSV</Btn>
              } />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Total Revenue',   value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, accent: '#f59e0b' },
                  { label: 'Hotel Bookings',  value: stats?.hotelBookings || 0,  accent: '#0ea5e9' },
                  { label: 'Flight Bookings', value: stats?.flightBookings || 0, accent: '#06b6d4' },
                  { label: 'Total Bookings',  value: stats?.totalBookings || 0,  accent: '#10b981' },
                ].map(card => <StatCard key={card.label} {...card} icon={<FiDollarSign size={15} />} />)}
              </div>
              <Card>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Monthly Revenue (Last 12 Months)</span>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats?.monthlyRevenue || []} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.82rem', background: 'var(--bg-card)' }} formatter={val => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="var(--primary)" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 280 }}>
                    <thead><tr>{['Month', 'Bookings', 'Revenue'].map(h => <th key={h} style={{ ...TH, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {[...(stats?.monthlyRevenue || [])].reverse().map((row, i) => (
                        <tr key={i} className="admin-row">
                          <td style={{ ...TD, fontWeight: 600, color: 'var(--text-primary)' }}>{row.month}</td>
                          <td style={{ ...TD, color: 'var(--text-secondary)' }}>{row.bookings}</td>
                          <td style={{ ...TD, fontWeight: 700, color: 'var(--primary)' }}>₹{row.revenue.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {showHotelForm && (
        <HotelFormModal
          hotel={editHotel}
          onClose={() => { setShowHotelForm(false); setEditHotel(null); }}
          onSave={loadData}
        />
      )}
      {showFlightForm && (
        <FlightFormModal
          flight={editFlight}
          onClose={() => { setShowFlightForm(false); setEditFlight(null); }}
          onSave={loadData}
        />
      )}
      {showUserModal && <UserFormModal isAdmin={false} onClose={() => setShowUserModal(false)} onSave={loadData} />}
      {showAdminModal && <UserFormModal isAdmin={true} onClose={() => setShowAdminModal(false)} onSave={loadData} />}
    </>
  );
}