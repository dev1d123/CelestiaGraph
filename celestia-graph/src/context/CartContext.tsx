import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type CartItem = {
  id: string;        // número / identificador de artículo
  name: string;      // nombre
  date: string;      // fecha (ISO corto)
  keywords: string;  // lista separada por comas
  authors: string;   // autores (separados por coma)
  abstract: string;  // resumen
  link: string;      // enlace
};

type CartCtx = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

const LS_KEY = 'celestia_graph_cart_v1';

// MIGRACIÓN legacy
function upgradeLegacy(obj: any): CartItem {
  if (obj && 'name' in obj && 'abstract' in obj) return obj as CartItem;
  return {
    id: obj?.id ?? String(Date.now()),
    name: obj?.label ?? 'Item migrado',
    date: obj?.addedAt ? String(obj.addedAt).split('T')[0] : new Date().toISOString().split('T')[0],
    keywords: obj?.category ? String(obj.category) : '',
    authors: 'N/A',
    abstract: obj?.note || 'Elemento migrado desde formato anterior.',
    link: '#'
  };
}

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(upgradeLegacy) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems(list => list.some(i => i.id === item.id) ? list : [...list, item]);
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
