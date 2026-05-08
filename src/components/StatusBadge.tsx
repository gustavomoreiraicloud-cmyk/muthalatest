import { Clock } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

interface Props {
  className?: string;
}

const StatusBadge = ({ className = "" }: Props) => {
  const { settings } = useStoreSettings();
  const open = settings?.is_open ?? true;

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider ${
        open
          ? "bg-[hsl(142_40%_45%/0.1)] border-[hsl(142_60%_45%/0.5)] text-[hsl(142_60%_55%)]"
          : "bg-destructive/10 border-destructive/40 text-destructive"
      } ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${open ? "bg-[hsl(142_70%_50%)]" : "bg-destructive"}`} />
      {open ? "Aberto" : "Fechado"}
    </span>
  );
};

export default StatusBadge;
