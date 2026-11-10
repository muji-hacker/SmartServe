import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout, { useAdminLive } from '../components/AdminLayout';
import { api } from '../api';
import { formatDuration, formatPrice, formatTime } from '../format';

export default function AdminDashboard() {
  return (
    <AdminLayout title="Overview">
      <DashboardBody />
    </AdminLayout>
  );
}

function DashboardBody() {
  const tick = useAdminLive();
  const [data, setData] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/api/admin/overview')
      .then(setData)
      .catch((error) => setMessage(error.message));
  }, [tick]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!data) {
    return <p>{message || 'Loading overview...'}</p>;
  }

  const cards = [
    ['Total tables', data.totalTables],
    ['Occupied', data.occupiedTables],
    ['Available', data.availableTables],
    ['Active sessions', data.activeSessions],
    ["Today's orders", data.todaysOrders],
    ["Today's total", formatPrice(data.todaysTotal)],
  ];

  return (
    <div>
      {message ? <p className="banner">{message}</p> : null}
      <div className="stat-grid">
        {cards.map(([label, value], index) => (
          <article key={label} className={`stat-card tone-${index}`}>
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="split">
        <section className="panel">
          <div className="section-heading">
            <h2>Occupied tables</h2>
            <Link to="/admin/tables">Manage</Link>
          </div>
          {data.occupied.length === 0 ? <p className="muted">All tables are available.</p> : null}
          <ul className="plain-list">
            {data.occupied.map((table) => (
              <li key={table.tableNumber}>
                <strong>Table {table.tableNumber}</strong>
                <span>{formatDuration(table.startedAt, now)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Latest orders</h2>
            <Link to="/admin/orders">View all</Link>
          </div>
          {data.latestOrders.length === 0 ? <p className="muted">No orders yet.</p> : null}
          <ul className="plain-list">
            {data.latestOrders.map((order) => (
              <li key={order.orderId}>
                <div>
                  <strong>#{order.orderId} · Table {order.tableNumber}</strong>
                  <p className="muted">{order.itemCount} items · {formatTime(order.receivedAt)}</p>
                </div>
                <div>
                  <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
                  <p>{formatPrice(order.totalAmount)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
