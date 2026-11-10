import { useEffect, useState } from 'react';
import AdminLayout, { useAdminLive } from '../components/AdminLayout';
import { api } from '../api';
import { formatPrice } from '../format';

const emptyItem = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  photoUrl: '/images/placeholder.jpg',
  isAvailable: true,
  isActive: true,
};

export default function AdminMenu() {
  return (
    <AdminLayout title="Menu">
      <MenuBody />
    </AdminLayout>
  );
}

function MenuBody() {
  const tick = useAdminLive();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', displayOrder: 0 });
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);

  function load() {
    return api('/api/admin/menu')
      .then((data) => {
        setCategories(data.categories);
        setItems(data.items);
        setItemForm((current) => ({
          ...current,
          categoryId: current.categoryId || data.categories[0]?.categoryId || '',
        }));
      })
      .catch((error) => setMessage(error.message));
  }

  useEffect(() => {
    load();
  }, [tick]);

  async function addCategory(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: categoryForm.name,
          displayOrder: Number(categoryForm.displayOrder),
        }),
      });
      setCategoryForm({ name: '', displayOrder: 0 });
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveCategory(category) {
    setMessage('');
    try {
      await api(`/api/admin/categories/${category.categoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(category),
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveItem(event) {
    event.preventDefault();
    setMessage('');
    const payload = {
      ...itemForm,
      price: Number(itemForm.price),
      categoryId: Number(itemForm.categoryId),
    };
    try {
      if (editingId) {
        await api(`/api/admin/menu-items/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/api/admin/menu-items', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setEditingId(null);
      setItemForm({ ...emptyItem, categoryId: categories[0]?.categoryId || '' });
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editItem(item) {
    setEditingId(item.itemId);
    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryId,
      photoUrl: item.photoUrl || '/images/placeholder.jpg',
      isAvailable: item.isAvailable,
      isActive: item.isActive,
    });
  }

  async function toggleAvailability(item) {
    setMessage('');
    try {
      await api(`/api/admin/menu-items/${item.itemId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="menu-admin">
      {message ? <p className="banner">{message}</p> : null}
      <section className="panel">
        <h2>Categories</h2>
        <form className="inline-form" onSubmit={addCategory}>
          <input
            placeholder="New category"
            value={categoryForm.name}
            onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
          />
          <input
            type="number"
            value={categoryForm.displayOrder}
            onChange={(event) => setCategoryForm({ ...categoryForm, displayOrder: event.target.value })}
          />
          <button type="submit" className="button">Add</button>
        </form>
        {categories.map((category) => (
          <CategoryRow key={category.categoryId} category={category} onSave={saveCategory} />
        ))}
      </section>
      <section className="panel">
        <h2>{editingId ? `Edit item #${editingId}` : 'Add menu item'}</h2>
        <form className="stack-form" onSubmit={saveItem}>
          <label>Name<input value={itemForm.name} onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })} /></label>
          <label>Description<textarea value={itemForm.description} onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })} /></label>
          <label>Price<input type="number" min="0" step="0.01" value={itemForm.price} onChange={(event) => setItemForm({ ...itemForm, price: event.target.value })} /></label>
          <label>
            Category
            <select value={itemForm.categoryId} onChange={(event) => setItemForm({ ...itemForm, categoryId: event.target.value })}>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={itemForm.isAvailable} onChange={(event) => setItemForm({ ...itemForm, isAvailable: event.target.checked })} />
            Available
          </label>
          <label className="check-row">
            <input type="checkbox" checked={itemForm.isActive} onChange={(event) => setItemForm({ ...itemForm, isActive: event.target.checked })} />
            Active
          </label>
          <div className="form-actions">
            <button type="submit" className="button">{editingId ? 'Save item' : 'Add item'}</button>
            {editingId ? (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingId(null);
                  setItemForm({ ...emptyItem, categoryId: categories[0]?.categoryId || '' });
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
        <div className="admin-item-list">
          {items.map((item) => (
            <article key={item.itemId} className={item.isActive ? '' : 'dimmed'}>
              <div>
                <strong>{item.name}</strong>
                <p className="muted">{item.categoryName} · {formatPrice(item.price)} · {item.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="form-actions">
                <button type="button" className={`toggle ${item.isAvailable ? '' : 'off'}`} onClick={() => toggleAvailability(item)}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </button>
                <button type="button" className="secondary" onClick={() => editItem(item)}>Edit</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function CategoryRow({ category, onSave }) {
  const [draft, setDraft] = useState(category);

  useEffect(() => {
    setDraft(category);
  }, [category]);

  return (
    <form
      className="category-row"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...draft,
          displayOrder: Number(draft.displayOrder),
          isActive: Boolean(draft.isActive),
        });
      }}
    >
      <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      <input type="number" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: event.target.value })} />
      <label className="check-row">
        <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />
        Active
      </label>
      <button type="submit" className="secondary">Save</button>
    </form>
  );
}
