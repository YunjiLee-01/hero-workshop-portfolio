import React, { useState, useEffect } from 'react';
import { ParticipantView } from './components/ParticipantView';
import { AdminView } from './components/AdminView';
import { QRBannerView } from './components/QRBannerView';
import { ViewMode } from './types';

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('PARTICIPANT');
  const [siteParam, setSiteParam] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    const site = searchParams.get('site');

    if (site) setSiteParam(site);

    if (mode === 'admin') {
      setViewMode('ADMIN');
    } else if (mode === 'qr' || mode === 'banner') {
      setViewMode('QR_BANNER');
    } else {
      setViewMode('PARTICIPANT');
    }

    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const m = sp.get('mode');
      const s = sp.get('site');
      if (s) setSiteParam(s);
      if (m === 'admin') setViewMode('ADMIN');
      else if (m === 'qr' || m === 'banner') setViewMode('QR_BANNER');
      else setViewMode('PARTICIPANT');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (mode: ViewMode) => {
    setViewMode(mode);
    const sp = new URLSearchParams(window.location.search);
    if (mode === 'ADMIN') {
      sp.set('mode', 'admin');
    } else if (mode === 'QR_BANNER') {
      sp.set('mode', 'qr');
    } else {
      sp.delete('mode');
    }
    const newUrl = `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {viewMode === 'PARTICIPANT' && (
        <ParticipantView
          siteParam={siteParam}
          onOpenAdmin={() => navigateTo('ADMIN')}
          onOpenQRBanner={() => navigateTo('QR_BANNER')}
        />
      )}

      {viewMode === 'ADMIN' && (
        <AdminView
          onOpenQRBanner={() => navigateTo('QR_BANNER')}
          onOpenParticipantView={() => navigateTo('PARTICIPANT')}
        />
      )}

      {viewMode === 'QR_BANNER' && (
        <QRBannerView
          onBackToParticipant={() => navigateTo('PARTICIPANT')}
          onOpenAdmin={() => navigateTo('ADMIN')}
        />
      )}
    </div>
  );
}

export default App;
