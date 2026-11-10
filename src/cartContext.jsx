import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'smartserve_cart';

function readCart() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const actions = useMemo(() => {
    function addItem(item) {
      setItems((current) => {
        const existing = current.find((line) => line.itemId === item.itemId);
        if (existing) {
          return current.map((line) =>
            line.itemId === item.itemId
              ? { ...line, quantity: Math.min(20, line.quantity + 1), unavailable: false }
              : line
          );
        }
        return [
          ...current,
          {
            itemId: item.itemId,
            name: item.name,
            price: item.price,
            photoUrl: item.photoUrl,
            quantity: 1,
            unavailable: false,
          },
        ];
      });
    }

    function changeQty(itemId, quantity) {
      setItems((current) =>
        current
          .map((line) =>
            line.itemId === itemId
              ? { ...line, quantity: Math.max(0, Math.min(20, quantity)) }
              : line
          )
          .filter((line) => line.quantity > 0)
      );
    }

    function removeItem(itemId) {
      setItems((current) => current.filter((line) => line.itemId !== itemId));
    }

    function clearCart() {
      setItems([]);
    }

    function syncWithMenu(menuItems) {
      setItems((current) =>
        current.map((line) => {
          const fresh = menuItems.get(line.itemId);
          if (!fresh || !fresh.isAvailable) return { ...line, unavailable: true };
          return {
            ...line,
            name: fresh.name,
            price: fresh.price,
            photoUrl: fresh.photoUrl,
            unavailable: false,
          };
        })
      );
    }

    return { addItem, changeQty, removeItem, clearCart, syncWithMenu };
  }, []);

  const count = items.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = items.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, ...actions }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
