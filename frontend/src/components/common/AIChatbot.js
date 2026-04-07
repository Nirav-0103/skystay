import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiZap, FiBookmark, FiCalendar, FiMapPin } from 'react-icons/fi';
import { MdFlight, MdHotel } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { aiAPI } from '../../utils/api';

const QUICK_REPLIES = [
  '📋 My bookings status',
  '🏨 Best hotels in Goa?',
  '✈️ Flights Delhi to Mumbai?',
  '🗺️ Plan 3 days in Jaipur',
  '❌ How to cancel booking?',
  '💳 Payment options?',
];

const STATUS_COLORS = {
  confirmed: '#10b981',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  completed: '#6366f1',
  refund_requested: '#f97316',
  refunded: '#3b82f6',
};

export default function AIChatbot() {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{
    from: 'bot',
    text: user
      ? `✨ Namaste **${user.name.split(' ')[0]}**! I'm **SkyBot** 🤖\n\nI can see your bookings and help you with:\n📋 Booking status & details\n🏨 Hotel recommendations\n✈️ Flight info\n🗺️ Trip planning\n\nWhat can I help you with?`
      : `✨ Namaste! I'm **SkyBot**, your AI travel concierge!\n\n🔐 **Login** to see your bookings & get personalized help!\n\nOr ask me about:\n🏨 Hotels & destinations\n✈️ Flights across India\n🗺️ Trip planning\n💳 Payments & bookings`,
    time: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [messages, open]);

  // Update greeting when user logs in
  useEffect(() => {
    if (user && messages.length === 1 && messages[0].from === 'bot') {
      setMessages([{
        from: 'bot',
        text: `✨ Namaste **${user.name.split(' ')[0]}**! I'm **SkyBot** 🤖\n\nI can see your bookings and help you with:\n📋 Booking status & details\n🏨 Hotel recommendations\n✈️ Flight info\n🗺️ Trip planning\n\nWhat can I help you with?`,
        time: new Date()
      }]);
    }
  }, [user]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMsg = { from: 'user', text: msg, time: new Date() };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      const res = await aiAPI.chat(msg, messages.slice(-12));
      const data = res.data;
      const reply = data.reply || data.message || "Sorry, please try again! 😅";
      setMessages(prev => [...prev, { from: 'bot', text: reply, time: new Date() }]);
      if (!open) setUnread(u => u + 1);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.reply || err.response?.data?.message || "Connection issue! 😅 Try again or call **1800-123-4567**";
      setMessages(prev => [...prev, { from: 'bot', text: errorMsg, time: new Date() }]);
    }
    setLoading(false);
  };

  const fmt = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((p, j) =>
          p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p
        )}
        {i < lines.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Floating Button */}
      <div className="floating-chat-btn" style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 999 }}>
        {!open && (
          <div className="chat-tooltip" style={{ position: 'absolute', bottom: '115%', right: 0, background: '#0d1b2e', color: 'white', padding: '8px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap', marginBottom: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            💬 Need travel help?
            <div style={{ position: 'absolute', bottom: -5, right: 16, width: 10, height: 10, background: '#0d1b2e', transform: 'rotate(45deg)' }} />
          </div>
        )}
        <button onClick={() => setOpen(!open)}
          style={{ width: 62, height: 62, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6ef5, #0e4fc4)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px rgba(26,110,245,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
          className="chat-toggle-btn"
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          {open ? <FiX size={24} /> : (
            <div style={{ position: 'relative', width: 28, height: 28 }}>
              {/* Premium 3D AI Core Orb */}
              <div style={{ 
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #ffffff, #60a5fa 40%, #1e3a8a)',
                boxShadow: '0 0 16px 4px rgba(96, 165, 250, 0.6), inset -4px -4px 10px rgba(0,0,0,0.5)',
                animation: 'aiPulse 2s infinite alternate, aiSpin 8s linear infinite'
              }} />
              <div style={{
                position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: 'rgba(255,255,255,0.8)',
                borderBottomColor: 'rgba(255,255,255,0.8)',
                animation: 'aiSpin 4s linear infinite reverse'
              }} />
            </div>
          )}
        </button>
        {!open && unread > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, width: 22, height: 22, background: '#ef4444', borderRadius: '50%', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '2px solid white' }}>
            {unread}
          </span>
        )}
      </div>

      {/* Chat Window */}
      {open && (
        <div className="chat-window" style={{ position: 'fixed', bottom: 108, right: 28, width: 'min(400px, calc(100vw - 40px))', height: 'min(580px, calc(100vh - 160px))', background: 'white', borderRadius: '20px', boxShadow: '0 24px 80px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', zIndex: 998, overflow: 'hidden', border: '1px solid #e5e7eb', animation: 'chatIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>

          {/* Header */}
          <div className="chat-header" style={{ background: 'linear-gradient(135deg, #0d1b2e, #1a3a6e, #1a6ef5)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
                <MdFlight size={22} color="white" />
              </div>
              <span style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, background: '#4ade80', borderRadius: '50%', border: '2px solid #0d1b2e' }} />
            </div>
            <div style={{ flex: 1 }} className="chat-header-info">
              <div style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>
                SkyBot AI <FiZap size={13} color="#fbbf24" style={{ display: 'inline', verticalAlign: 'middle' }} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem' }}>
                {user ? `Logged in as ${user.name}` : 'Powered by SkyStay  • Always Online'}
              </div>
            </div>
            {user && (
              <div className="bookings-linked-badge" style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '4px 10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
                📋 Bookings Linked
              </div>
            )}
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <FiX size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                {msg.from === 'bot' && (
                  <div style={{ width: 28, height: 28, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #bfdbfe' }}>
                    <MdFlight size={13} color="#1a6ef5" />
                  </div>
                )}
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.from === 'user' ? 'linear-gradient(135deg, #1a6ef5, #0e4fc4)' : '#f8fafc', color: msg.from === 'user' ? 'white' : '#111827', fontSize: '0.85rem', lineHeight: 1.65, boxShadow: msg.from === 'user' ? '0 4px 12px rgba(26,110,245,0.3)' : '0 1px 3px rgba(0,0,0,0.08)', border: msg.from === 'bot' ? '1px solid #e5e7eb' : 'none' }}>
                  {fmt(msg.text)}
                  <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: 4, textAlign: msg.from === 'user' ? 'right' : 'left' }}>
                    {new Date(msg.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 28, height: 28, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
                  <MdFlight size={13} color="#1a6ef5" />
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 5, border: '1px solid #e5e7eb' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 7, height: 7, background: '#1a6ef5', borderRadius: '50%', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div style={{ padding: '6px 12px 8px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
              {(user ? QUICK_REPLIES : QUICK_REPLIES.slice(1)).map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '20px', border: '1.5px solid #1a6ef5', background: '#eff6ff', color: '#1a6ef5', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1a6ef5'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#1a6ef5'; }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, flexShrink: 0, background: 'white' }} className="chat-input-area">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={user ? "Ask about your bookings or travel..." : "Ask about hotels, flights..."}
              disabled={loading}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '20px', border: '1.5px solid #e5e7eb', fontSize: '0.85rem', outline: 'none', transition: 'border 0.2s', background: '#f9fafb' }}
              onFocus={e => { e.target.style.borderColor = '#1a6ef5'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
              className="chat-input"
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              style={{ width: 42, height: 42, borderRadius: '50%', background: input.trim() ? 'linear-gradient(135deg, #1a6ef5, #0e4fc4)' : '#e5e7eb', color: 'white', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
              className="chat-send-btn">
              <FiSend size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes chatIn { from{opacity:0;transform:scale(0.9) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes aiPulse { 0% { transform: scale(0.95); opacity: 0.8; } 100% { transform: scale(1.05); opacity: 1; } }
        @keyframes aiSpin { 100% { transform: rotate(360deg); } }
        
        @media (max-width: 500px) {
          .chat-window {
            width: 100% !important;
            height: 100% !important;
            bottom: 0 !important;
            right: 0 !important;
            border-radius: 0 !important;
            max-width: none !important;
            max-height: none !important;
          }
          .chat-header {
            padding: 12px 14px !important;
            border-radius: 0 !important;
          }
          .chat-header-info {
            display: none !important;
          }
          .floating-chat-btn {
            bottom: 20px !important;
            right: 20px !important;
            width: 54px !important;
            height: 54px !important;
          }
          .chat-input-area {
            padding: 10px !important;
          }
          .chat-input {
            padding: 8px 12px !important;
            font-size: 0.8rem !important;
          }
          .chat-send-btn {
            width: 36px !important;
            height: 36px !important;
          }
        }
      `}</style>
    </>
  );
}