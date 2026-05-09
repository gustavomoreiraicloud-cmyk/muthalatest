import { useStoreSettings } from "@/hooks/useStoreSettings";
import { isWithinHours, DEFAULT_HOURS } from "@/lib/businessHours";

interface Props {
  className?: string;
}

const StatusBadge = ({ className = "" }: Props) => {
  const { settings } = useStoreSettings();
  
  // O status "Aberto" só é verdadeiro se:
  // 1. O admin marcou manualmente como aberto (settings.is_open)
  // 2. Estamos dentro do horário de funcionamento
  const withinHours = isWithinHours(settings?.business_hours || DEFAULT_HOURS);
  const isOpenManual = settings?.is_open ?? true;
  const isOpen = isOpenManual && withinHours;

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-bold uppercase tracking-wider ${
        isOpen
          ? "bg-[hsl(142_40%_45%/0.1)] border-[hsl(142_60%_45%/0.5)] text-[hsl(142_60%_55%)]"
          : "bg-destructive/10 border-destructive/40 text-destructive"
      } ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${isOpen ? "bg-[hsl(142_70%_50%)]" : "bg-destructive"}`}
      />
      {isOpen ? "Aberto" : "Fechado"}
    </span>
  );
};

export default StatusBadge;
