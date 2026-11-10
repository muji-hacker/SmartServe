import { Link } from 'react-router-dom';

export default function Footer({ restaurant }) {
  return (
    <footer className="footer">
      <div>
        <strong>{restaurant?.name || 'Crumbl Cafe'}</strong>
        <p>Delicious Food, Fresh Flavours & Memorable Moments — Made Just for You.</p>
      </div>
      <div>
        <p className="footer-label">Visit</p>
        <p>{restaurant?.address || 'Plot 12, Bukhari Commercial, DHA Phase 6, Karachi'}</p>
        {restaurant?.phone ? <p>{restaurant.phone}</p> : null}
      </div>
      <div>
        <p className="footer-label">Hours</p>
        <p>Every day, 10:00AM to 12:00AM</p>
        <p>Kitchen last call at 12:00</p>
      </div>
      <div className="footer-links">
        <Link to="/">Tables</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/admin/login">Staff</Link>
      </div>
    </footer>
  );
}
