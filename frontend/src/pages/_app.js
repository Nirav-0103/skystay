import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import AIChatbot from '../components/common/AIChatbot';
import dynamic from 'next/dynamic';
import { appWithTranslation } from 'next-i18next';

const LuxuryCursor = dynamic(() => import('../components/common/LuxuryCursor'), { ssr: false });
import 'leaflet/dist/leaflet.css';
import '../styles/globals.css';
import SmoothScroll from '../components/common/SmoothScroll';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';

function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <NotificationProvider>
            <SmoothScroll>
              <Toaster position="top-right" containerStyle={{ zIndex: 10000000 }} toastOptions={{
                style: { fontFamily: 'Plus Jakarta Sans, sans-serif', borderRadius: '12px', fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
                success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
                error: { iconTheme: { primary: '#ef4444', secondary: 'white' } }
              }} />
              <LuxuryCursor />
              <AnimatePresence mode="wait" initial={false}>
                <PageTransition>
                  <Component {...pageProps} />
                </PageTransition>
              </AnimatePresence>
              <AIChatbot />
            </SmoothScroll>
          </NotificationProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default appWithTranslation(App);