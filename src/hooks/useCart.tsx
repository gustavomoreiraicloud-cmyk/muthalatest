import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type CartItem = {
  name: string;
  price: string; // "R$ 29,90"
  img: string;
  qty: number;
};

type CartContextType = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (name: string) => void;
  inc: (name: string) => void;
  dec: (name: string) => void;
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

const parsePrice = (p: string): number => {
  const cleaned = p.replace(/[^\d,]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.name === item.name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const remove = (name: string) =>
    setItems((prev) => prev.filter((i) => i.name !== name));

  const inc = (name: string) =>
    setItems((prev) =>
      prev.map((i) => (i.name === name ? { ...i, qty: i.qty + 1 } : i))
    );

  const dec = (name: string) =>
    setItems((prev) =>
      prev
        .map((i) => (i.name === name ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );

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
