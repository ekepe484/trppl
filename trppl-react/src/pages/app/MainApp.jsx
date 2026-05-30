// src/pages/app/MainApp.jsx
import { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { DiscoverTab }       from './DiscoverTab';
import { NotificationsTab }  from './NotificationsTab';
import { TrpplTab }          from './TrpplTab';
import { GamesTab }          from './GamesTab';
import { WaitingTab }        from './WaitingTab';
import { useAuthStore }      from '../../store/authStore';
import { useNavigate }       from 'react-router-dom';

export default function MainApp() {
  const [tab, setTab] = useState('discover');
  const user          = useAuthStore(s => s.user);
  const navigate      = useNavigate();

  // Nudge if not verified
  const showNudge = user && !user.profileVerified && user.verificationStatus === 'none';

  return (
    <AppShell activeTab={tab} onTabChange={setTab}>
      {/* Verify nudge */}
      {showNudge && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-800">
          <i className="ti ti-shield-check text-orange-500 text-lg flex-shrink-0" />
          <span className="flex-1 text-xs text-orange-800 dark:text-orange-300">Verify your identity to get a <strong>verified badge</strong>.</span>
          <button onClick={() => navigate('/verify-identity')}
            className="text-violet-600 text-xs font-bold whitespace-nowrap">Verify →</button>
        </div>
      )}

      {tab === 'discover' && <DiscoverTab />}
      {tab === 'notifs'   && <NotificationsTab />}
      {tab === 'trppl'    && <TrpplTab onGoToGames={() => setTab('games')} />}
      {tab === 'games'    && <GamesTab />}
      {tab === 'waiting'  && <WaitingTab />}
    </AppShell>
  );
}
