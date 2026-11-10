import { motion, useReducedMotion } from 'framer-motion';
import { formatPrice } from '../format';

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      layout={!reduce}
      className={`cart-item ${item.unavailable ? 'is-unavailable' : ''}`}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, x: 20 }}
    >
      <img src={item.photoUrl || '/images/placeholder.jpg'} alt="" />
      <div className="cart-item-copy">
        <h3>{item.name}</h3>
        <p>{item.unavailable ? 'Currently unavailable' : formatPrice(item.price)}</p>
        <div className="stepper">
          <button type="button" onClick={onDecrease} aria-label={`Decrease ${item.name}`}>−</button>
          <span>{item.quantity}</span>
          <button type="button" onClick={onIncrease} aria-label={`Increase ${item.name}`}>+</button>
        </div>
      </div>
      <div className="cart-item-side">
        <strong>{formatPrice(item.price * item.quantity)}</strong>
        <button type="button" className="text-button" onClick={onRemove}>Remove</button>
      </div>
    </motion.article>
  );
}
