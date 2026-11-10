import { useEffect, useState } from 'react';
import AdminLayout, { useAdminLive } from '../components/AdminLayout';
import TableCard from '../components/TableCard';
import { api } from '../api';
import { formatDuration, formatPrice } from '../format';

export default function AdminTables() {
  return (
    <AdminLayout title="Tables">
      <TablesBody />
    </AdminLayout>
  );
}

function TablesBody() {
  const tick = useAdminLive();
  const [tables, setTables] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/api/admin/tables')
      .then((data) => setTables(data.tables))
      .catch((error) => setMessage(error.message));
  }, [tick]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function freeTable(tableId) {
    setMessage('');
    try {
      await api(`/api/admin/tables/${tableId}/close-session`, { method: 'POST' });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div>
      {message ? <p className="banner">{message}</p> : null}
      <div className="table-grid">
        {tables.map((table, index) => (
          <TableCard
            key={table.tableId}
            index={index}
            tableNumber={table.tableNumber}
            status={table.status}
            capacity={table.capacity}
            meta={
              table.status === 'Occupied' ? (
                <div className="table-meta">
                  <p className="timer">Occupied for {formatDuration(table.startedAt, now)}</p>
                  {table.orders.length === 0 ? <p className="muted">No order yet</p> : null}
                  <ul>
                    {table.orders.map((order) => (
                      <li key={order.orderId}>
                        #{order.orderId} · {order.status} · {formatPrice(order.totalAmount)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="muted">Ready for a guest</p>
              )
            }
            action={
              table.status === 'Occupied' ? (
                <button type="button" className="secondary" onClick={() => freeTable(table.tableId)}>
                  Free table
                </button>
              ) : null
            }
          />
        ))}
      </div>
    </div>
  );
}
