import { motion, useReducedMotion } from 'framer-motion';

export default function TableCard({
  tableNumber,
  status,
  capacity,
  meta,
  action,
  onSelect,
  disabled,
  index = 0,
}) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      className={`table-card status-${String(status || '').toLowerCase()}`}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.45, delay: reduce ? 0 : index * 0.05 }}
    >
      <div>
        <p className={`status-pill status-${String(status || '').toLowerCase()}`}>{status}</p>
        <p className="table-number">Dining table</p>
        <h2>{tableNumber}</h2>
        {capacity ? <p className="muted">{capacity} seats</p> : null}
      </div>
      {meta}
      {onSelect ? (
        <button type="button" disabled={disabled} onClick={onSelect}>
          {disabled ? 'In use' : 'Select table'}
        </button>
      ) : null}
      {action}
    </motion.article>
  );
}
