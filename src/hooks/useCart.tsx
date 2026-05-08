import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type CartItem = {
  name: string;
  price: string; // "R$ 29,90"
  img: string;
  qty: number;
  options?: {
    burgerSize?: string;
    beverage?: string;
    extras?: string[];
    doneness?: string;
    notes?: string;
  };
};

type CartContextType = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (id: string) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  clear: () => void;
  count: number;
  total: number; // numeric
  totalLabel: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "muthala_cart_v1";

const parsePrice = (p: string | number): number => {
  if (typeof p === "number") return p;
  const cleaned = p.replace(/[^\d,]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Helper to generate unique ID for same product with different options
const getItemId = (item: Omit<CartItem, "qty"> | CartItem) => {
  if (!item.options) return item.name;
  return `${item.name}-${JSON.stringify(item.options)}`;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add: CartContextType["add"] = (item) => {
    const id = getItemId(item);
    setItems((prev) => {
      const idx = prev.findIndex((i) => getItemId(i) === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => getItemId(i) !== id));
  };

  const inc = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (getItemId(i) === id ? { ...i, qty: i.qty + 1 } : i))
    );
  };

  const dec = (id: string) => {
    setItems((prev) =>
      prev
        .map((i) => (getItemId(i) === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const clear = () => setItems([]);

  const { count, total } = useMemo(() => {
    let c = 0;
    let t = 0;
    for (const i of items) {
      c += i.qty;
      t += parsePrice(i.price) * i.qty;
    }
    return { count: c, total: t };
  }, [items]);

  const value: CartContextType = {
    items,
    add,
    remove,
    inc,
    dec,
    clear,
    count,
    total,
    totalLabel: formatBRL(total),
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { formatBRL, parsePrice };
