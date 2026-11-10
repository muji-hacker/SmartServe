import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MenuCard from '../components/MenuCard';
import { api } from '../api';
import { clearSession, getSession } from '../session';
import { getSocket } from '../socket';
import { useCart } from '../cartContext';
import { formatPrice } from '../format';

export default function Menu() {
  const navigate = useNavigate();
  const { items, addItem, count, subtotal, clearCart, syncWithMenu } = useCart();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [message, setMessage] = useState('');
  const session = getSession();

  async function leaveIfClosed() {
    if (!session.sessionId) {
      navigate('/', { replace: true });
      return false;
    }
    try {
      const current = await api(`/api/sessions/${session.sessionId}`);
      if (!current.active) {
        clearSession();
        clearCart();
        navigate('/', { replace: true, state: { notice: 'This table was freed. Please choose a table again.' } });
        return false;
      }
      return true;
    } catch (error) {
      clearSession();
      clearCart();
      navigate('/', { replace: true });
      return false;
    }
  }

  async function loadMenu() {
    const open = await leaveIfClosed();
    if (!open) return;
    const [menu, info] = await Promise.all([api('/api/menu'), api('/api/restaurant')]);
    setCategories(menu.categories);
    setRestaurant(info);
    const items = new Map();
    menu.categories.forEach((category) => {
      category.items.forEach((item) => items.set(item.itemId, item));
    });
    syncWithMenu(items);
  }

  useEffect(() => {
    loadMenu().catch((error) => setMessage(error.message));
    const socket = getSocket();
    const refresh = () => loadMenu().catch(() => {});
    socket.on('menu:updated', refresh);
    socket.on('table:updated', refresh);
    return () => {
      socket.off('menu:updated', refresh);
      socket.off('table:updated', refresh);
    };
  }, []);

  function scrollToCategory(categoryId) {
    setActiveCategory(categoryId);
    document.getElementById(`category-${categoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="customer-page">
      <Navbar />
      <main className={`menu-page ${count > 0 ? 'has-dock' : ''}`}>
        <div className="menu-head">
          <div className="menu-hero">
            <p className="eyebrow">Table {session.tableNumber}</p>
            <h1>The menu</h1>
            <p className="muted">What the kitchen is cooking today. Prices on the card are the prices charged.</p>
          </div>
          {message ? <p className="banner">{message}</p> : null}
          <div className="menu-categories">
            {categories.map((category) => (
              <button
                key={category.categoryId}
                type="button"
                className={activeCategory === category.categoryId ? 'active' : ''}
                onClick={() => scrollToCategory(category.categoryId)}
              >
                {category.name}
                <em>{category.items.length}</em>
              </button>
            ))}
          </div>
        </div>
        {categories.length === 0 ? <div className="skeleton" /> : null}
        {categories.map((category) => (
          <section key={category.categoryId} id={`category-${category.categoryId}`} className="menu-section">
            <div className="section-heading tight">
              <h2>{category.name}</h2>
              <p>{category.items.length} dishes</p>
            </div>
            <div className="menu-grid">
              {category.items.map((item, index) => (
                <MenuCard
                  key={item.itemId}
                  item={item}
                  index={index}
                  badge={index === 0 ? 'Popular' : category.name}
                  onAdd={addItem}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
      {count > 0 ? (
        <Link to="/cart" className="cart-dock">
          <img src={items[0]?.photoUrl || '/images/placeholder.jpg'} alt="" />
          <div>
            <strong>{count} {count === 1 ? 'item' : 'items'}</strong>
            <span>Table {session.tableNumber}</span>
          </div>
          <em>{formatPrice(subtotal)}</em>
          <span className="dock-cta">View cart</span>
        </Link>
      ) : null}
      <Footer restaurant={restaurant} />
    </div>
  );
}
