import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TableCard from '../components/TableCard';
import MenuCard from '../components/MenuCard';
import { api } from '../api';
import { getSession, setSession, clearSession } from '../session';
import { getSocket } from '../socket';
import { useCart } from '../cartContext';

const categoryArt = {
  Starters: '/images/samosa.jpg',
  Mains: '/images/biryani.jpg',
  Drinks: '/images/coffee.jpg',
  Desserts: '/images/lava-cake.jpg',
};

const highlights = [
  { title: 'From the table', text: 'Order without an app. Your table number is the only account you need.' },
  { title: 'Kitchen in real time', text: 'The counter sees the order the moment you send it, then updates the status.' },
  { title: 'House recipes', text: 'Samosas, dum biryani, cold coffee, and a warm lava cake after the main course.' },
  { title: 'A calm room', text: 'Espresso wood, warm cream, and a short menu cooked for the table in front of you.' },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();
  const { addItem, clearCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [message, setMessage] = useState(location.state?.notice || '');
  const [busyTable, setBusyTable] = useState('');

  async function load() {
    const [restaurantData, tableData, menu] = await Promise.all([
      api('/api/restaurant'),
      api('/api/tables'),
      api('/api/menu'),
    ]);
    setRestaurant(restaurantData);
    setTables(tableData.tables);
    setCategories(menu.categories || []);

    const saved = getSession();
    if (!saved.sessionId) {
      setActiveSession(null);
      return;
    }
    try {
      const session = await api(`/api/sessions/${saved.sessionId}`);
      if (!session.active) {
        clearSession();
        clearCart();
        setActiveSession(null);
        return;
      }
      setActiveSession(session);
    } catch (error) {
      clearSession();
      clearCart();
      setActiveSession(null);
    }
  }

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
    const socket = getSocket();
    const refresh = () => load().catch(() => {});
    socket.on('table:updated', refresh);
    socket.on('menu:updated', refresh);
    return () => {
      socket.off('table:updated', refresh);
      socket.off('menu:updated', refresh);
    };
  }, []);

  async function selectTable(tableNumber) {
    setBusyTable(tableNumber);
    setMessage('');
    try {
      const session = await api(`/api/tables/${tableNumber}/session`, { method: 'POST' });
      setSession(session.sessionId, session.tableNumber);
      navigate('/menu');
    } catch (error) {
      setMessage(error.message);
      await load();
    } finally {
      setBusyTable('');
    }
  }

  function orderFromHome(item) {
    if (!activeSession) {
      setMessage('Choose a table first. The dish stays on the menu until you are seated.');
      document.getElementById('tables')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    addItem(item);
    setMessage(`${item.name} is in the cart for Table ${activeSession.tableNumber}.`);
  }

  const dishes = categories.flatMap((category) =>
    category.items.map((item) => ({ ...item, categoryName: category.name }))
  );
  const popular = dishes.filter((item) => item.isAvailable).slice(0, 4);
  const featuredNames = ['Zinger Burger', 'Chicken Biryani', 'Cold Coffee', 'Molten Lava Cake'];
  const featured = featuredNames
    .map((name) => dishes.find((item) => item.name === name))
    .filter(Boolean);
  const bestSellers = featured.length ? featured : dishes.slice(4, 8);

  return (
    <div className="customer-page">
      <Navbar />
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">DHA Phase 6 · Karachi</p>
          <h1>{restaurant?.name || 'SmartServe Cafe'}</h1>
          <p className="lead">
            A neighbourhood table for grilled plates, cold coffee, and dessert. Sit down, pick your table, and send the order to the kitchen.
          </p>
          <div className="hero-actions">
            <a className="button" href="#tables">Choose your table</a>
            {activeSession ? (
              <Link className="ghost-button" to="/menu">Continue at Table {activeSession.tableNumber}</Link>
            ) : (
              <a className="ghost-button" href="#popular">See the menu</a>
            )}
          </div>
          {restaurant ? <p className="hero-meta">{restaurant.address}<br />{restaurant.phone}</p> : null}
          {message ? <p className="banner">{message}</p> : null}
        </div>
        <div className="hero-stage">
          <span className="hero-orb orb-a" />
          <span className="hero-orb orb-b" />
          <div className="hero-frame">
            <img src="/images/hero.jpg" alt="A set cafe table with plates, glassware, and warm light" />
          </div>
          <article className="float-card">
            <img src="/images/coffee.jpg" alt="" />
            <div>
              <strong>Cold coffee</strong>
              <span>Blended to order</span>
            </div>
          </article>
          <article className="float-card late">
            <img src="/images/lava-cake.jpg" alt="" />
            <div>
              <strong>Lava cake</strong>
              <span>Warm center</span>
            </div>
          </article>
        </div>
      </section>

      <section className="home-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The board</p>
            <h2>Start with a course</h2>
          </div>
          <p>Four parts of the menu, ready when you sit.</p>
        </div>
        <div className="category-row-home">
          {(categories.length ? categories : Object.keys(categoryArt).map((name) => ({ name, categoryId: name }))).map((category) => {
            const Tile = activeSession ? Link : 'a';
            return (
              <Tile
                key={category.categoryId || category.name}
                className="category-tile"
                to="/menu"
                href="#tables"
              >
                <img src={categoryArt[category.name] || '/images/placeholder.jpg'} alt="" />
                <span>{category.name}</span>
              </Tile>
            );
          })}
        </div>
      </section>

      <section className="home-block" id="popular">
        <div className="section-heading">
          <div>
            <p className="eyebrow">From the kitchen</p>
            <h2>Popular right now</h2>
          </div>
          <p>Live dishes from the cafe menu.</p>
        </div>
        <div className="menu-grid">
          {popular.map((item, index) => (
            <MenuCard
              key={item.itemId}
              item={item}
              index={index}
              badge={item.categoryName}
              onAdd={orderFromHome}
            />
          ))}
        </div>
      </section>

      <section className="offer-band">
        <article className="offer-card offer-main">
          <p className="eyebrow">This week</p>
          <h2>Biryani and a cold coffee</h2>
          <p>Ask for the lunch pairing when you order Chicken Biryani. The coffee is blended with milk and a little chocolate.</p>
          <a className="button" href="#tables">Order at your table</a>
        </article>
        <article className="offer-card offer-side">
          <img src="/images/kunafa.jpg" alt="Kunafa pastry" />
          <div>
            <p className="eyebrow">After dinner</p>
            <h3>Kunafa, when it is on</h3>
            <p>Crisp pastry, cheese, and pistachio syrup. The card shows unavailable if the kitchen has paused it.</p>
          </div>
        </article>
      </section>

      <section className="home-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Guests reorder</p>
            <h2>Best sellers</h2>
          </div>
        </div>
        <div className="menu-grid">
          {bestSellers.map((item, index) => (
            <MenuCard key={item.itemId} item={item} index={index} badge="Best seller" onAdd={orderFromHome} />
          ))}
        </div>
      </section>

      <section className="intro-band">
        <img src="/images/pasta.jpg" alt="Creamy fettuccine on a cafe table" />
        <div>
          <p className="eyebrow">The room</p>
          <h2>A small cafe with a direct line to the kitchen.</h2>
          <p>
            SmartServe Cafe sits on Bukhari Commercial. Guests choose a table, browse photographs of what is actually cooking, and the order lands with the staff without a printed slip.
          </p>
          <ul>
            <li>Open seating for two, four, and six</li>
            <li>Prices on the card are the prices that get charged</li>
            <li>Status moves from received, to preparing, to served</li>
          </ul>
        </div>
      </section>

      <section className="home-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Why guests stay</p>
            <h2>The cafe, briefly</h2>
          </div>
        </div>
        <div className="highlight-grid">
          {highlights.map((item, index) => (
            <motion.article
              key={item.title}
              className="highlight-card"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: reduce ? 0 : index * 0.06 }}
            >
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <main className="home-block" id="tables">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Floor</p>
            <h2>Select your table</h2>
          </div>
          <p>Occupied tables stay locked until the admin frees them.</p>
        </div>
        <div className="table-stage">
          <div className="table-grid">
            {tables.length === 0 ? (
              <>
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
              </>
            ) : tables.map((table, index) => (
              <TableCard
                key={table.tableId}
                index={index}
                tableNumber={table.tableNumber}
                status={table.status}
                capacity={table.capacity}
                disabled={table.status !== 'Vacant' || busyTable === table.tableNumber}
                onSelect={() => selectTable(table.tableNumber)}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer restaurant={restaurant} />
    </div>
  );
}
