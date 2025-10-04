import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type CartItem = {
  id: string;
  label: string;
  category: string;
  depth: number;
  energy: string;
  price: string;
  addedAt: string;
  note?: string;
};

type CartCtx = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

const LS_KEY = 'celestia_graph_cart_v1';

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems(list => {
      if (list.some(i => i.id === item.id)) return list;
      return [...list, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(list => list.filter(i => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};
