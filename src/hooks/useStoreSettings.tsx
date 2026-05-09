import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BusinessHours } from "@/lib/businessHours";

export type StoreSettings = {
  id: string;
  store_name: string;
  phone: string;
  address: string | null;
  delivery_fee: number;
  min_order: number;
  is_open: boolean;
  hours: string | null;
  business_hours: BusinessHours | null;
  latitude: number | null;
  longitude: number | null;
  estimated_delivery_time: number | null;
  pix_key: string | null;
  pix_qr_code_url: string | null;
} & Partial<{
  pix_key: string;
  pix_qr_code_url: string;
}>;

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("store_settings_public").select("*").maybeSingle();
      if (mounted) {
        setSettings(data as unknown as StoreSettings | null);
        setLoading(false);
      }
    };
    load();
    const ch = supabase
      .channel(`store-settings-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_settings_public" },
        (payload) => {
          if (payload.new) setSettings(payload.new as unknown as StoreSettings);
        },
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return { settings, loading };
}
