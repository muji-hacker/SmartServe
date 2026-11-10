import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSession } from './session';
import { getSocket } from './socket';

const NotificationContext = createContext(null);
const STORAGE_KEY = 'smartserve_notifications';

const messages = {
  placed: 'Your order has been received successfully!',
  additional: 'Your additional order has been received!',
  preparing: 'Your delicious food is being prepared!',
  served: 'Your order has been served. Enjoy!',
};

function readHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    const sessionId = getSession().sessionId;
    return Array.isArray(saved) ? saved.filter((item) => item.sessionId === sessionId) : [];
  } catch (error) {
    return [];
  }
}

export function NotificationProvider({ children }) {
  const location = useLocation();
  const [items, setItems] = useState(readHistory);
  const seen = useRef(new Set(readHistory().map((item) => item.id)));
  const [toasts, setToasts] = useState([]);
  const [open, setOpen] = useState(false);
  const onAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (onAdmin) return undefined;
    const socket = getSocket();

    function join() {
      const { sessionId } = getSession();
      if (sessionId) socket.emit('join-session', { sessionId });
    }

    function onNotify(payload) {
      const { sessionId } = getSession();
      const message = messages[payload?.kind];
      if (!message || payload.sessionId !== sessionId) return;
      const id = `${payload.orderId}:${payload.status}`;
      if (seen.current.has(id)) return;
      seen.current.add(id);
      const entry = {
        id,
        orderId: payload.orderId,
        status: payload.status,
        sessionId,
        message,
        at: new Date().toISOString(),
        read: false,
      };
      setItems((current) => [entry, ...current.filter((item) => item.id !== id)]);
      setToasts((shown) => [...shown, entry].slice(-3));
    }

    join();
    socket.on('connect', join);
    socket.on('order:notify', onNotify);
    return () => {
      socket.off('connect', join);
      socket.off('order:notify', onNotify);
    };
  }, [onAdmin, location.pathname]);

  useEffect(() => {
    if (toasts.length === 0) return undefined;
    const timer = setTimeout(() => setToasts((current) => current.slice(1)), 4200);
    return () => clearTimeout(timer);
  }, [toasts]);

  const value = useMemo(() => {
    const unread = items.filter((item) => !item.read).length;
    return {
      items,
      unread,
      open,
      toggle() {
        setOpen((current) => {
          const next = !current;
          if (next) {
            setItems((existing) => existing.map((item) => ({ ...item, read: true })));
          }
          return next;
        });
      },
      close() {
        setOpen(false);
      },
    };
  }, [items, open]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {onAdmin ? null : (
        <div className="toast-stack" aria-live="polite">
          {toasts.map((toast) => (
            <article key={toast.id} className="toast">
              <strong>Order #{toast.orderId}</strong>
              <p>{toast.message}</p>
            </article>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
