import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DBMenuItem = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  ingredients: string[];
  price: number;
  image_url: string | null;
  available: boolean;
  highlight: boolean;
  sort_order: number;
};

export function useMenu() {
  const [items, setItems] = useState<DBMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .order("sort_order")
        .order("name");
      if (mounted) {
        setItems((data as DBMenuItem[]) ?? []);
        setLoading(false);
      }
    };
    load();
    const ch = supabase
      .channel("menu-items-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => load())
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return { items, loading };
}
