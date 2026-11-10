import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SessionOrders from '../components/SessionOrders';
import { api } from '../api';
import { getSession } from '../session';
import { getSocket } from '../socket';
import { formatPrice, formatTime } from '../format';

const steps = ['Received', 'Preparing', 'Served'];

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('');
  const session = getSession();

  async function load() {
    if (!session.sessionId) {
      setMessage('This order is tied to the table session in this browser.');
      return;
    }
    const data = await api(`/api/orders/${orderId}?sessionId=${session.sessionId}`);
    setOrder(data);
  }

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
    const socket = getSocket();
    const join = () => socket.emit('join-order', {
      orderId: Number(orderId),
      sessionId: session.sessionId,
    });
    const refresh = (payload) => {
      if (!payload?.orderId || Number(payload.orderId) === Number(orderId)) {
        load().catch(() => {});
      }
    };
    join();
    socket.on('connect', join);
    socket.on('order:updated', refresh);
    return () => {
      socket.off('connect', join);
      socket.off('order:updated', refresh);
    };
  }, [orderId]);

  return (
    <div className="customer-page">
      <Navbar />
      <main className="confirm-page">
        {message ? <p className="banner">{message}</p> : null}
        {order ? (
          <section className="confirm-card">
            <div className="success-ring" aria-hidden="true">✓</div>
            <p className="eyebrow">Order confirmed</p>
            <h1>Order #{order.orderId}</h1>
            <p className="muted">Table {order.tableNumber} · {formatTime(order.receivedAt)}</p>
            <div className="status-track">
              {steps.map((step) => (
                <span key={step} className={steps.indexOf(order.status) >= steps.indexOf(step) ? 'done' : ''}>
                  {step}
                </span>
              ))}
            </div>
            <div className="wait-panel">
              <span>Estimated waiting time</span>
              <strong>About {order.estimatedWaitMinutes} minutes</strong>
            </div>
            <ul className="confirm-items">
              {order.items.map((item) => (
                <li key={`${item.itemName}-${item.quantity}`}>
                  <span>{item.quantity} × {item.itemName}</span>
                  <strong>{formatPrice(item.lineTotal)}</strong>
                </li>
              ))}
            </ul>
            <div className="summary-row total-row">
              <span>Total</span>
              <strong>{formatPrice(order.totalAmount)}</strong>
            </div>
            <Link className="button" to="/menu">Order something else</Link>
          </section>
        ) : null}
        <SessionOrders exceptOrderId={orderId} />
      </main>
    </div>
  );
}
