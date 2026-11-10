import { formatPrice, formatTime } from '../format';

export default function OrderCard({ order, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`order-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div>
        <strong>Order #{order.orderId}</strong>
        <p className="muted">Table {order.tableNumber}</p>
      </div>
      <div className="order-card-side">
        <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
        <strong>{formatPrice(order.totalAmount)}</strong>
        <p className="muted">{formatTime(order.receivedAt)}</p>
      </div>
    </button>
  );
}
