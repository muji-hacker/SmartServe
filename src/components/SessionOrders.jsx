import { useEffect, useState } from 'react';
import { api } from '../api';
import { getSession } from '../session';
import { getSocket } from '../socket';
import { formatPrice, formatTime } from '../format';

export default function SessionOrders({ exceptOrderId }) {
  const session = getSession();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!session.sessionId) return undefined;
    let active = true;

    async function load() {
      const data = await api(`/api/orders?sessionId=${session.sessionId}`);
      if (!active) return;
      const next = data.orders || [];
      setOrders(next);
      const socket = getSocket();
      next.forEach((order) => {
        socket.emit('join-order', { orderId: order.orderId, sessionId: session.sessionId });
      });
    }

    load().catch(() => {});
    const socket = getSocket();
    const refresh = () => load().catch(() => {});
    socket.on('connect', refresh);
    socket.on('order:updated', refresh);
    return () => {
      active = false;
      socket.off('connect', refresh);
      socket.off('order:updated', refresh);
    };
  }, [session.sessionId]);

  const visible = orders.filter((order) => Number(order.orderId) !== Number(exceptOrderId));
  if (visible.length === 0) return null;

  const total = visible.reduce((sum, order) => sum + Number(order.totalAmount), 0);

  return (
    <section className="placed-orders">
      <div className="section-heading tight">
        <p className="eyebrow">This table</p>
        <h2>{exceptOrderId ? 'Earlier orders' : 'Orders already sent'}</h2>
      </div>
      {visible.map((order) => (
        <article key={order.orderId} className="placed-order">
          <header>
            <div>
              <strong>Order #{order.orderId}</strong>
              <p className="muted">{formatTime(order.receivedAt)}</p>
            </div>
            <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
          </header>
          <ul className="confirm-items">
            {order.items.map((item) => (
              <li key={`${order.orderId}-${item.itemName}-${item.quantity}`}>
                <span>{item.quantity} × {item.itemName}</span>
                <strong>{formatPrice(item.lineTotal)}</strong>
              </li>
            ))}
          </ul>
          <div className="summary-row">
            <span>Order total</span>
            <strong>{formatPrice(order.totalAmount)}</strong>
          </div>
        </article>
      ))}
      <div className="summary-row placed-grand">
        <span>{visible.length} {visible.length === 1 ? 'order' : 'orders'} sent</span>
        <strong>{formatPrice(total)}</strong>
      </div>
    </section>
  );
}
