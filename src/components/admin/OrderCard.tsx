import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, Paperclip, User, Truck as TruckIcon, Route, Weight, Fuel } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import DemurrageTimer from "@/components/demurrage/DemurrageTimer";
import { getActiveLeg, getDemurrageSettings, LEG_LABEL } from "@/lib/demurrage";

type Order = Tables<"orders">;

interface OrderCardProps {
  order: Order;
  index: number;
  isSelected: boolean;
  driverName: string | null;
  truckPlate: string | null;
  docsCount: number;
  onClick: () => void;
}

const CARGO_COLORS: Record<string, string> = {
  standard: "bg-muted text-muted-foreground",
  grain: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "зерно": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  urgent: "bg-red-500/15 text-red-400 border-red-500/20",
  "терміново": "bg-red-500/15 text-red-400 border-red-500/20",
  fragile: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "крихке": "bg-violet-500/15 text-violet-400 border-violet-500/20",
  hazardous: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "небезпечне": "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

const CARGO_LABELS: Record<string, string> = {
  standard: "Стандарт",
  grain: "Зерно",
  urgent: "Терміново",
  fragile: "Крихке",
  hazardous: "Небезпечне",
};

function getCargoLabel(type: string) {
  return CARGO_LABELS[type.toLowerCase()] ?? type;
}

function getCargoColor(type: string) {
  return CARGO_COLORS[type.toLowerCase()] ?? CARGO_COLORS.standard;
}

export default function OrderCard({ order, index, isSelected, driverName, truckPlate, docsCount, onClick }: OrderCardProps) {
  const fuelEstimate = order.distance && order.fuel_cost
    ? Number(order.fuel_cost)
    : order.distance
      ? Math.round(Number(order.distance) * 0.33)
      : null;

  return (
    <Draggable draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group rounded-xl border bg-card p-2.5 space-y-2 cursor-pointer transition-all duration-150 ${
            snapshot.isDragging
              ? "shadow-xl shadow-secondary/20 border-secondary/60 scale-[1.02] rotate-1"
              : isSelected
                ? "border-secondary shadow-md shadow-secondary/10"
                : "border-border/60 hover:border-muted-foreground/40 hover:shadow-sm hover:bg-card/90"
          }`}
          onClick={onClick}
        >
          {/* Row 1: drag handle + order number + cargo badge + docs */}
          <div className="flex items-center gap-1.5">
            <div
              {...provided.dragHandleProps}
              className="text-muted-foreground/30 group-hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground tracking-wide">
              {order.order_number}
            </span>
            {order.cargo_type && order.cargo_type !== "standard" && (
              <Badge
                variant="outline"
                className={`ml-1 text-[9px] px-1.5 py-0 h-4 font-semibold border ${getCargoColor(order.cargo_type)}`}
              >
                {getCargoLabel(order.cargo_type)}
              </Badge>
            )}
            {activeLeg && (
              <DemurrageTimer
                compact
                label={LEG_LABEL[activeLeg]}
                arrivedAt={activeLeg === "loading" ? order.loading_arrived_at : order.unloading_arrived_at}
                freeHours={demurrage.freeHours}
                rate={demurrage.rate}
                currency={demurrage.currency}
              />
            )}
            {docsCount > 0 && (
              <span className="ml-auto flex items-center gap-0.5 text-[10px] text-blue-400">
                <Paperclip className="w-3 h-3" />
                <span>{docsCount}</span>
              </span>
            )}
          </div>

          {/* Row 2: Client name */}
          <p className="font-semibold text-sm text-foreground truncate leading-tight">
            {order.client_name}
          </p>

          {/* Row 3: Route with truck icon */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-foreground/80 font-medium truncate max-w-[100px]">{order.origin}</span>
            <TruckIcon className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
            <span className="text-foreground/80 font-medium truncate max-w-[100px]">{order.destination}</span>
          </div>

          {/* Row 4: Driver + truck plate + distance */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {driverName ? (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-md">
                <User className="w-2.5 h-2.5 text-muted-foreground/70" />
                {driverName}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md border border-orange-500/20">
                Без водія
              </span>
            )}
            {truckPlate && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold tracking-wider text-foreground bg-foreground/10 border border-foreground/20 px-2 py-0.5 rounded">
                {truckPlate}
              </span>
            )}
            {order.distance && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
                <Route className="w-2.5 h-2.5" />
                {Number(order.distance).toLocaleString("uk-UA")} км
              </span>
            )}
          </div>

          {/* Row 5: Footer - price + fuel */}
          <div className="pt-1.5 border-t border-border/40 flex items-center justify-between">
            {order.total_price ? (
              <span className="text-sm font-bold text-green-400">
                {Number(order.total_price).toLocaleString("uk-UA")} ₴
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50">Ціна не вказана</span>
            )}
            {fuelEstimate !== null && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                <Fuel className="w-2.5 h-2.5" />
                ~{fuelEstimate.toLocaleString("uk-UA")} л
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
