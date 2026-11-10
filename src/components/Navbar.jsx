import { Link } from 'react-router-dom';
import { useCart } from '../cartContext';
import { getSession } from '../session';
import { useNotifications } from '../notifications';
import { formatTime } from '../format';

export default function Navbar() {
  const { count } = useCart();
  const { tableNumber } = getSession();
  const notes = useNotifications();

  return (
    <header className="nav">
      <Link to="/" className="brand">
        <span className="brand-mark">S</span>
        <span>
          SmartServe
          <small>Cafe</small>
        </span>
      </Link>
      <div className="nav-actions">
        {tableNumber ? <span className="table-chip">Table {tableNumber}</span> : null}
        <div className="note-wrap">
          <button
            type="button"
            className="note-button"
            aria-label={`Order updates${notes.unread ? `, ${notes.unread} new` : ''}`}
            onClick={notes.toggle}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {notes.unread > 0 ? <span>{notes.unread}</span> : null}
          </button>
          {notes.open ? (
            <div className="note-panel">
              <strong>Order updates</strong>
              {notes.items.length === 0 ? <p className="muted">Updates for this table will appear here.</p> : null}
              <ul>
                {notes.items.map((item) => (
                  <li key={item.id}>
                    <span>Order #{item.orderId}</span>
                    <p>{item.message}</p>
                    <small>{formatTime(item.at)}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <Link to="/cart" className="cart-link">
          Cart
          <span>{count}</span>
        </Link>
      </div>
    </header>
  );
}
