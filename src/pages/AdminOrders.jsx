import { useEffect, useState } from 'react';
import AdminLayout, { useAdminLive } from '../components/AdminLayout';
import OrderCard from '../components/OrderCard';
import { api } from '../api';
import { formatPrice, formatTime } from '../format';

export default function AdminOrders() {
  return (
    <AdminLayout title="Orders">
      <OrdersBody />
    </AdminLayout>
  );
}

function OrdersBody() {
  const tick = useAdminLive();
  const [view, setView] = useState('incoming');
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const query = view === 'history' && status ? `&status=${status}` : '';
    api(`/api/admin/orders?view=${view}${query}`)
      .then((data) => {
        setOrders(data.orders);
        setSelectedId((current) => current || data.orders[0]?.orderId || null);
      })
      .catch((error) => setMessage(error.message));
  }, [tick, view, status]);

  const selected = orders.find((order) => order.orderId === selectedId) || orders[0];

  async function advance(order) {
    const next = order.status === 'Received' ? 'Preparing' : 'Served';
    setMessage('');
    try {
      await api(`/api/admin/orders/${order.orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="segment">
          <button type="button" className={view === 'incoming' ? 'active' : ''} onClick={() => setView('incoming')}>Incoming</button>
          <button type="button" className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>History</button>
        </div>
        {view === 'history' ? (
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="Received">Received</option>
            <option value="Preparing">Preparing</option>
            <option value="Served">Served</option>
          </select>
        ) : null}
      </div>
      {message ? <p className="banner">{message}</p> : null}
      {orders.length === 0 ? <p className="muted">No orders in this view.</p> : null}
      <div className="orders-layout">
        <div className="order-list">
          {orders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              selected={selected?.orderId === order.orderId}
              onSelect={() => setSelectedId(order.orderId)}
            />
          ))}
        </div>
        {selected ? (
          <article className="panel order-detail">
            <div className="section-heading">
              <h2>Order #{selected.orderId}</h2>
              <span className={`status-pill status-${selected.status.toLowerCase()}`}>{selected.status}</span>
            </div>
            <p>Table {selected.tableNumber}</p>
            <p className="muted">Placed {formatTime(selected.receivedAt)}</p>
            <ul className="confirm-items">
              {selected.items.map((item) => (
                <li key={`${selected.orderId}-${item.itemName}-${item.quantity}`}>
                  <span>{item.quantity} × {item.itemName}</span>
                  <strong>{formatPrice(item.lineTotal)}</strong>
                </li>
              ))}
            </ul>
            <div className="summary-row total-row">
              <span>Total</span>
              <strong>{formatPrice(selected.totalAmount)}</strong>
            </div>
            {selected.status !== 'Served' ? (
              <button type="button" className="button" onClick={() => advance(selected)}>
                Mark {selected.status === 'Received' ? 'Preparing' : 'Served'}
              </button>
            ) : (
              <p className="muted">Served {formatTime(selected.servedAt)}</p>
            )}
          </article>
        ) : null}
      </div>
    </div>
  );
}
