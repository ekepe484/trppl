// src/pages/app/NotificationsTab.jsx
import { useAppStore } from '../../store/appStore';

const ICON_MAP = {
  match:          { cls: 'bg-violet-100 text-violet-600',  icon: 'ti-sparkles' },
  trppl:          { cls: 'bg-orange-100 text-orange-600',  icon: 'ti-sword'    },
  win:            { cls: 'bg-green-100 text-green-600',    icon: 'ti-trophy'   },
  loss:           { cls: 'bg-red-100 text-red-600',        icon: 'ti-clock'    },
  date_request:   { cls: 'bg-violet-100 text-violet-600',  icon: 'ti-heart'    },
  date_accepted:  { cls: 'bg-green-100 text-green-600',    icon: 'ti-check'    },
  date_declined:  { cls: 'bg-red-100 text-red-600',        icon: 'ti-x'        },
  date_cancelled: { cls: 'bg-red-100 text-red-600',        icon: 'ti-ban'      },
  date_completed: { cls: 'bg-green-100 text-green-600',    icon: 'ti-star'     },
  date_incoming:  { cls: 'bg-violet-100 text-violet-600',  icon: 'ti-calendar' },
};

function timeAgo(date) {
  const secs = Math.floor((new Date() - new Date(date)) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return `${Math.floor(secs/60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
  return `${Math.floor(secs/86400)}d ago`;
}

export function NotificationsTab() {
  const notifications = useAppStore(s => s.notifications);

  const DEMO = [
    { id: 1, type: 'match',   title: 'You have a unique match!', body: "You and Sophie share the same primary love language. You're connected!", created_at: new Date(Date.now() - 2*60000), read: false },
    { id: 2, type: 'trppl',   title: "You've got competition! 🔥", body: 'Sophie also matched with James. Win the game to win the date.', created_at: new Date(Date.now() - 60000), read: false },
    { id: 3, type: 'win',     title: 'Trivia challenge sent', body: 'James has 24 hours to accept.', created_at: new Date(), read: true },
    { id: 4, type: 'loss',    title: 'Marcus lost their Trppl', body: 'Marcus is in the 7-day waiting room.', created_at: new Date(Date.now() - 86400000), read: true },
  ];

  const items = notifications.length ? notifications : DEMO;

  return (
    <div>
      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pt-4 pb-2">Notifications</p>
      <div className="card mx-3.5">
        {items.map((n, i) => {
          const ico = ICON_MAP[n.type] || { cls: 'bg-neutral-100 text-neutral-500', icon: 'ti-bell' };
          return (
            <div key={n.id || i}
              className={`flex gap-3 p-4 ${i < items.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''} ${!n.read ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}>
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${ico.cls}`}>
                <i className={`ti ${ico.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">{n.title}</div>
                <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{n.body}</div>
                <div className="text-[10px] text-neutral-400 mt-1">{timeAgo(n.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
