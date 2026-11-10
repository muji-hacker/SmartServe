import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CartItem from '../components/CartItem';
import SessionOrders from '../components/SessionOrders';
import { api } from '../api';
import { clearSession, getSession } from '../session';
import { useCart } from '../cartContext';
import { formatPrice } from '../format';

export default function Cart() {
  const navigate = useNavigate();
  const { items, subtotal, changeQty, removeItem, clearCart } = useCart();
  const [message, setMessage] = useState('');
  const [placing, setPlacing] = useState(false);
  const lock = useRef(false);
  const session = getSession();
  const hasBlockedItem = items.some((item) => item.unavailable);

  useEffect(() => {
    if (!session.sessionId) navigate('/', { replace: true });
  }, [navigate, session.sessionId]);

  async function placeOrder() {
    if (lock.current || items.length === 0 || hasBlockedItem) return;
    lock.current = true;
    setPlacing(true);
    setMessage('');
    try {
      const order = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.sessionId,
          items: items.map((item) => ({ itemId: item.itemId, quantity: item.quantity })),
        }),
      });
      clearCart();
      navigate(`/order/${order.orderId}`);
    } catch (error) {
      if (error.status === 409) {
        clearSession();
        clearCart();
        navigate('/', { replace: true, state: { notice: error.message } });
        return;
      }
      setMessage(error.message);
      lock.current = false;
      setPlacing(false);
    }
  }

  return (
    <div className="customer-page">
      <Navbar />
      <main className="cart-page">
        <div className="menu-hero">
          <p className="eyebrow">Table {session.tableNumber}</p>
          <h1>Your cart</h1>
        </div>
        <SessionOrders />
        {items.length === 0 ? (
          <div className="empty-state">
            <p className="eyebrow">Nothing waiting to send</p>
            <h2>The cart is empty</h2>
            <p className="muted">Add a dish from the menu and it will appear here. Orders already sent stay listed above.</p>
            <Link className="button" to="/menu">Back to menu</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div>
              {items.map((item) => (
                <CartItem
                  key={item.itemId}
                  item={item}
                  onIncrease={() => changeQty(item.itemId, item.quantity + 1)}
                  onDecrease={() => changeQty(item.itemId, item.quantity - 1)}
                  onRemove={() => removeItem(item.itemId)}
                />
              ))}
            </div>
            <aside className="summary-card">
              <p className="eyebrow">Summary</p>
              <h2>Ready to send</h2>
              <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div className="summary-row"><span>Total</span><strong className="summary-total">{formatPrice(subtotal)}</strong></div>
              <p className="muted">No tax is added in this version. The server recalculates the total from menu prices.</p>
              {hasBlockedItem ? <p className="banner">Remove unavailable items before placing the order.</p> : null}
              {message ? <p className="banner">{message}</p> : null}
              <button type="button" className="button full" disabled={placing || hasBlockedItem} onClick={placeOrder}>
                {placing ? 'Placing order...' : 'Place order'}
              </button>
              <Link to="/menu" className="text-link">Add more items</Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
