import { motion, useReducedMotion } from 'framer-motion';
import { formatPrice } from '../format';

export default function MenuCard({ item, onAdd, index = 0, badge }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      className={`menu-card ${item.isAvailable ? '' : 'is-unavailable'}`}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      whileHover={reduce ? undefined : { y: -10, rotateX: 5, rotateY: -6 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22, delay: reduce ? 0 : (index % 4) * 0.05 }}
    >
      <div className="menu-card-photo">
        <img src={item.photoUrl || '/images/placeholder.jpg'} alt={item.name} />
        {badge ? <span className="food-badge">{badge}</span> : null}
        {!item.isAvailable ? <span className="food-badge muted-badge">Paused</span> : null}
      </div>
      <div className="menu-card-body">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <div className="menu-card-row">
          <strong>{formatPrice(item.price)}</strong>
          {item.isAvailable ? (
            <button type="button" onClick={() => onAdd(item)}>Add to cart</button>
          ) : (
            <span className="unavailable-label">Unavailable</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
