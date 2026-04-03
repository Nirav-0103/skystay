import Link from 'next/link';
import { MdFlight } from 'react-icons/md';
import { FiTwitter, FiInstagram, FiFacebook, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  const links = {
    Explore: [
      { label: 'All Hotels', href: '/hotels' },
      { label: 'All Flights', href: '/flights' },
      { label: 'Popular Destinations', href: '/destinations' },
      { label: 'Deals & Offers', href: '/deals' },
      { label: 'Trip Planner', href: '/' },
    ],
    Support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Cancellation Policy', href: '/cancellation-policy' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Contact Us', href: '/help' },
    ]
  };

  return (
    <footer style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d1b2e 100%)', color: 'white' }}>
      {/* Top section */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '56px 0 40px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
            {/* Brand */}
            <div style={{ gridColumn: 'span 1' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, textDecoration: 'none' }}>
                <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #1a6ef5, #0e4fc4)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(26,110,245,0.4)' }}>
                  <MdFlight color="white" size={22} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg, #fff, #a5c0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SkyStay</div>
                  <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.12em' }}>PREMIUM TRAVEL</div>
                </div>
              </Link>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 20 }}>
                India's most trusted platform for luxury hotel & flight bookings. Best prices, guaranteed.
              </p>

              {/* Social */}
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { icon: <FiInstagram size={15} />, href: '#' },
                  { icon: <FiTwitter size={15} />, href: '#' },
                  { icon: <FiFacebook size={15} />, href: '#' },
                  { icon: <FiYoutube size={15} />, href: '#' }
                ].map((s, i) => (
                  <a key={i} href={s.href}
                    style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.25s', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {Object.entries(links).map(([section, items]) => (
              <div key={section}>
                <h4 style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 18, color: 'white', letterSpacing: '0.06em' }}>{section.toUpperCase()}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(item => (
                    <Link key={item.label} href={item.href}
                      style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textDecoration: 'none', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.paddingLeft = '4px'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.paddingLeft = '0'; }}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Contact */}
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 18, color: 'white', letterSpacing: '0.06em' }}>CONTACT US</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: <FiMail size={14} />, text: 'support@skystay.com' },
                  { icon: <FiPhone size={14} />, text: '1800-123-4567 (24/7)' },
                  { icon: <FiMapPin size={14} />, text: 'Surat, India 🇮🇳' }
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--primary)', flexShrink: 0 }}>{c.icon}</div>
                    {c.text}
                  </div>
                ))}
              </div>

              {/* App badges */}
              <div style={{ marginTop: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginBottom: 10, fontWeight: 600, letterSpacing: '0.08em' }}>COMING SOON</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['App Store', 'Google Play'].map(s => (
                    <div key={s} style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'not-allowed' }}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>© 2026 SkyStay. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>🔒 SSL Secured</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Made with ❤️ in India 🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
}