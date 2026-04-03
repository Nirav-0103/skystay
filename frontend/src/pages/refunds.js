import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { bookingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiClock, FiCheckCircle, FiAlertCircle, FiChevronRight } from 'react-icons/fi';

const REFUND_STAGES = [
  { label: 'Requested', icon: <FiClock /> },
  { label: 'Approved', icon: <FiCheckCircle /> },
  { label: 'Processing', icon: <FiRefreshCw /> },
  { label: 'Completed', icon: <FiCheckCircle /> }
];

export default function RefundsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error('Please login to view your refunds');
      router.push('/');
      return;
    }
    loadRefunds();
  }, [user, authLoading]);

  const loadRefunds = async () => {
    try {
      const res = await bookingAPI.getMyRefunds();
      setRefunds(res.data.refunds || []);
    } catch (err) {
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><div className="loader" /></div>
    </>
  );

  return (
    <>
      <Head><title>My Refunds - SkyStay</title></Head>
      <Navbar />

      <div className="page-header">
        <div className="container">
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.8rem' }}>My Refunds</h1>
          <p style={{ opacity: 0.8, marginTop: 4 }}>Track your refund status and progress</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 900 }}>
        {refunds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 20, border: '1px solid var(--border)' }}>
            <FiRefreshCw size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3 style={{ fontWeight: 700 }}>No refund history</h3>
            <p style={{ color: 'var(--text-secondary)' }}>You don't have any active or past refund requests.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {refunds.map((r, i) => (
              <div key={r._id} style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', animation: `fadeInUp 0.4s ease ${i * 0.1}s both` }}>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700 }}>BOOKING #{r.bookingId}</div>
                      <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{r.bookingType === 'hotel' ? r.hotel?.name : `${r.flight?.airline} ${r.flight?.flightNumber}`}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>₹{r.refund?.amount?.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Refund Amount</div>
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  <div style={{ position: 'relative', marginBottom: 32, paddingTop: 20 }}>
                    <div style={{ position: 'absolute', top: 40, left: '10%', right: '10%', height: 2, background: '#e5e7eb', zIndex: 1 }} />
                    <div style={{ position: 'absolute', top: 40, left: '10%', width: `${r.refund?.currentStage * 26.66 + 10}%`, height: 2, background: 'var(--primary)', zIndex: 1, transition: '0.5s ease' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                      {REFUND_STAGES.map((s, idx) => {
                        const isPast = idx < r.refund?.currentStage;
                        const isCurrent = idx === r.refund?.currentStage;
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '25%' }}>
                            <div style={{ 
                              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isPast || isCurrent ? 'var(--primary)' : 'white',
                              color: isPast || isCurrent ? 'white' : '#9ca3af',
                              border: `2px solid ${isPast || isCurrent ? 'var(--primary)' : '#e5e7eb'}`,
                              boxShadow: isCurrent ? '0 0 0 4px rgba(26,110,245,0.2)' : 'none',
                              transition: '0.3s'
                            }}>
                              {s.icon}
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: 8, color: isCurrent ? 'var(--primary)' : '#64748b' }}>{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* History */}
                  <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16 }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-secondary)' }}>REFUND HISTORY</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {r.refund?.history?.map((h, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 12, fontSize: '0.82rem' }}>
                          <div style={{ minWidth: 80, color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(h.timestamp).toLocaleDateString()}</div>
                          <div style={{ fontWeight: 600 }}>{h.stage}:</div>
                          <div style={{ color: 'var(--text-secondary)' }}>{h.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
