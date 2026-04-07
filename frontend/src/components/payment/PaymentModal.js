import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiCreditCard, FiSmartphone, FiHome } from 'react-icons/fi';

export default function PaymentModal({ amount, bookingData, onSuccess, onClose, user, razorpayKey }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const walletBal = user?.walletBalance || 0;
  const canUseWallet = walletBal >= amount;

  const isHotel = bookingData?.bookingType === 'hotel';
  const isFlight = bookingData?.bookingType === 'flight';

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayAtHotel = async () => {
    setLoading(true);
    try {
      await onSuccess('cod');
      toast.success('Booking request sent! Awaiting admin confirmation.');
      onClose();
    } catch (err) {
      toast.error('Booking failed');
    }
    setLoading(false);
  };

  const handleRazorpay = async (method) => {
    setLoading(true);
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error('Razorpay failed to load');
      setLoading(false);
      return;
    }

    const options = {
      key: razorpayKey || 'rzp_test_Saa4MIHeMmOARW',
      amount: amount * 100,
      currency: 'INR',
      name: 'SkyStay',
      description: isHotel ? 'Hotel Booking' : 'Flight Booking',
      image: '/logo.png',
      handler: async (response) => {
        try {
          await onSuccess(method, {
            transactionId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
          });
          toast.success('Payment successful! Booking confirmed 🎉');
          onClose();
        } catch (err) {
          toast.error('Booking save failed');
        }
        setLoading(false);
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: { color: '#1a6ef5' },
      modal: {
        ondismiss: () => { setLoading(false); }
      }
    };

    // UPI specific config
    if (method === 'upi') {
      options.method = { upi: true, card: false, netbanking: false, wallet: false };
      options.config = {
        display: {
          blocks: {
            upi: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] }
          },
          sequence: ['block.upi'],
          preferences: { show_default_blocks: false }
        }
      };
    }

    // Card specific
    if (method === 'card') {
      options.method = { card: true, upi: false, netbanking: false, wallet: false };
    }

    // Netbanking
    if (method === 'netbanking') {
      options.method = { netbanking: true, card: false, upi: false, wallet: false };
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      toast.error(`Payment failed: ${response.error.description}`);
      setLoading(false);
    });
    rzp.open();
    setLoading(false);
  };

  // ✅ FIX: Flight booking માટે COD/Pay at Hotel option show નહીં થાય
  const allPaymentOptions = [
    {
      id: 'wallet',
      label: 'SkyPay Wallet',
      icon: <span style={{ fontSize: '1.2rem' }}>💳</span>,
      desc: canUseWallet
        ? `Balance: ₹${walletBal.toLocaleString('en-IN')} ✅`
        : `Balance: ₹${walletBal.toLocaleString('en-IN')} — Need ₹${(amount - walletBal).toLocaleString('en-IN')} more`,
      color: '#fbbf24',
      bg: '#fcf8eb',
      disabled: !canUseWallet
    },
    {
      id: 'card',
      label: 'Credit / Debit Card',
      icon: <FiCreditCard size={22} color="#1a6ef5" />,
      desc: 'Visa, Mastercard, Rupay',
      color: '#1a6ef5',
      bg: '#e8f0fe'
    },
    {
      id: 'upi',
      label: 'UPI / GPay / PhonePe',
      icon: <FiSmartphone size={22} color="#10b981" />,
      desc: 'GPay, PhonePe, Paytm & more',
      color: '#10b981',
      bg: '#d1fae5'
    },
    {
      id: 'netbanking',
      label: 'Net Banking',
      icon: <span style={{ fontSize: '1.2rem' }}>🏦</span>,
      desc: 'All major banks supported',
      color: '#f59e0b',
      bg: '#fef3c7'
    },
    // ✅ માત્ર Hotel booking માટે જ show થશે
    ...(!isFlight ? [{
      id: 'cod',
      label: 'Pay at Hotel',
      icon: <FiHome size={22} color="#6366f1" />,
      desc: 'Pay when you arrive',
      color: '#6366f1',
      bg: '#eef2ff'
    }] : [])
  ];

  const handlePay = async () => {
    if (paymentMethod === 'cod') { handlePayAtHotel(); return; }
    
    // Handle SkyPay Wallet
    if (paymentMethod === 'wallet') {
      if ((user?.walletBalance || 0) < amount) {
        toast.error('Insufficient SkyPay Wallet balance! Please top up your wallet in Profile.');
        return;
      }
      setLoading(true);
      try {
        await onSuccess('wallet', { transactionId: 'TXN_SKY_' + Date.now() });
        toast.success('Payment successful via SkyPay Wallet! 🎉');
        onClose();
      } catch (err) {
        toast.error('Booking failed');
      }
      setLoading(false);
      return;
    }

    handleRazorpay(paymentMethod);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 520 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem' }}>Complete Payment</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>Choose your payment method</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Amount */}
        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0e4fc4 100%)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', opacity: 0.8 }}>Total Amount</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{amount?.toLocaleString()}</div>
          </div>
          <div style={{ opacity: 0.7, fontSize: '0.85rem' }}>
            {isHotel ? '🏨 Hotel Booking' : '✈️ Flight Booking'}
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {allPaymentOptions.map(opt => (
            <div key={opt.id} onClick={() => !opt.disabled && setPaymentMethod(opt.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 'var(--radius-md)', border: `2px solid ${paymentMethod === opt.id ? opt.color : 'var(--border)'}`, background: paymentMethod === opt.id ? opt.bg : 'white', cursor: opt.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: opt.disabled ? 0.6 : 1 }}>
              <div style={{ width: 42, height: 42, background: paymentMethod === opt.id ? opt.bg : 'var(--bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {opt.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{opt.label}</div>
                <div style={{ fontSize: '0.78rem', color: opt.disabled && opt.id === 'wallet' ? '#ef4444' : 'var(--text-muted)' }}>
                  {opt.disabled && opt.id === 'wallet' ? `Need ₹${(amount - (user?.walletBalance || 0)).toLocaleString()} more` : opt.desc}
                </div>
              </div>
              {/* UPI logos */}
              {opt.id === 'upi' && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>G</span>
                  <span style={{ fontSize: '0.7rem', background: '#5f259f', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Pe</span>
                  <span style={{ fontSize: '0.7rem', background: '#00baf2', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Pt</span>
                </div>
              )}
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentMethod === opt.id ? opt.color : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {paymentMethod === opt.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: opt.color }} />}
              </div>
            </div>
          ))}
        </div>

        {/* Pay Button */}
        <button onClick={handlePay} disabled={loading}
          style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-full)', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
          {loading
            ? <span className="loader" style={{ width: 20, height: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
            : paymentMethod === 'cod'
              ? '📋 Request Booking'
              : `🔒 Pay ₹${amount?.toLocaleString()}`
          }
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 12 }}>
          🔒 Secured by Razorpay • 256-bit SSL Encryption
        </p>

      </div>
    </div>
  );
}