import { createContext, useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../api';
import { getSocket } from '../socket';

const AdminLiveContext = createContext(0);

const links = [
  { to: '/admin', label: 'Overview', end: true, icon: 'grid' },
  { to: '/admin/tables', label: 'Tables', icon: 'tables' },
  { to: '/admin/orders', label: 'Orders', icon: 'orders' },
  { to: '/admin/menu', label: 'Menu', icon: 'menu' },
];

function SideIcon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round' };
  if (name === 'tables') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="6" height="6" rx="1.5" {...common} /><rect x="14" y="5" width="6" height="6" rx="1.5" {...common} /><rect x="4" y="14" width="6" height="6" rx="1.5" {...common} /><rect x="14" y="14" width="6" height="6" rx="1.5" {...common} /></svg>;
  }
  if (name === 'orders') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10M7 12h10M7 17h6" {...common} /></svg>;
  }
  if (name === 'menu') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h9" {...common} /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h7V4H4v9zm9 7h7V4h-7v16zM4 20h7v-5H4v5z" {...common} /></svg>;
}

export function useAdminLive() {
  return useContext(AdminLiveContext);
}

export default function AdminLayout({ title, children }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    api('/api/auth/me')
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        localStorage.removeItem('smartserve_token');
        navigate('/admin/login', { replace: true });
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!ready) return undefined;
    const socket = getSocket();
    const token = localStorage.getItem('smartserve_token');
    const join = () => socket.emit('join-admin', token);
    const bump = () => setTick((value) => value + 1);
    join();
    socket.on('connect', join);
    socket.on('order:created', bump);
    socket.on('order:updated', bump);
    socket.on('table:updated', bump);
    socket.on('menu:updated', bump);
    return () => {
      socket.emit('leave-admin');
      socket.off('connect', join);
      socket.off('order:created', bump);
      socket.off('order:updated', bump);
      socket.off('table:updated', bump);
      socket.off('menu:updated', bump);
    };
  }, [ready]);

  function logout() {
    const socket = getSocket();
    socket.emit('leave-admin');
    localStorage.removeItem('smartserve_token');
    navigate('/admin/login', { replace: true });
  }

  if (!ready) {
    return <div className="admin-loading">Checking admin session...</div>;
  }

  return (
    <AdminLiveContext.Provider value={tick}>
      <div className="admin-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="brand-mark">S</span>
            <div>
              <p className="eyebrow">SmartServe</p>
              <strong>Admin</strong>
            </div>
          </div>
          <nav>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'side-link active' : 'side-link')}
              >
                <SideIcon name={link.icon} />
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">
            <a className="side-link" href="/">Customer site</a>
            <button type="button" className="text-button" onClick={logout}>Log out</button>
          </div>
        </aside>
        <section className="admin-main">
          <header className="admin-top">
            <div>
              <p className="eyebrow">SmartServe Cafe</p>
              <h1>{title}</h1>
            </div>
          </header>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>
        </section>
      </div>
    </AdminLiveContext.Provider>
  );
}
