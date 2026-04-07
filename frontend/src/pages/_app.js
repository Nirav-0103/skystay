import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import AIChatbot from '../components/common/AIChatbot';
import dynamic from 'next/dynamic';

const LuxuryCursor = dynamic(() => import('../components/common/LuxuryCursor'), { ssr: false });
import 'leaflet/dist/leaflet.css';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <NotificationProvider>
            <Toaster position="top-right" containerStyle={{ zIndex: 10000000 }} toastOptions={{
              style: { fontFamily: 'Plus Jakarta Sans, sans-serif', borderRadius: '12px', fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
              success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
              error: { iconTheme: { primary: '#ef4444', secondary: 'white' } }
            }} />
            <LuxuryCursor />
            <Component {...pageProps} />
            <AIChatbot />
          </NotificationProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}