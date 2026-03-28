import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock, FileText, Upload, MapPin, User, Phone,
  Package, Truck, Loader2, Download, Image, File
} from "lucide-react";
import { toast } from "sonner";

type Order = Tables<"orders">;

interface OrderEvent {
  id: string;
  order_id: string;
  user_id: string | null;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
}

interface OrderDetailPanelProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverName: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Нове", color: "bg-blue-500" },
  planning: { label: "Планування", color: "bg-cyan-500" },
  in_transit: { label: "В дорозі", color: "bg-orange-500" },
  customs: { label: "Митниця", color: "bg-violet-500" },
  unloading: { label: "Розвантаження", color: "bg-yellow-500" },
  awaiting_payment: { label: "Очікує оплати", color: "bg-purple-500" },
  completed: { label: "Завершено", color: "bg-green-500" },
};

export default function OrderDetailPanel({ order, open, onOpenChange, driverName }: OrderDetailPanelProps) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!order || !open) return;
    fetchEvents();
    fetchFiles();
  }, [order?.id, open]);

  const fetchEvents = async () => {
    if (!order) return;
    setLoadingEvents(true);
    const { data } = await supabase
      .from("order_events")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });
    setEvents((data as OrderEvent[]) ?? []);
    setLoadingEvents(false);
  };

  const fetchFiles = async () => {
    if (!order) return;
    setLoadingFiles(true);
    const { data } = await supabase.storage
      .from("order-documents")
      .list(order.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    setFiles((data as StorageFile[]) ?? []);
    setLoadingFiles(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${order.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("order-documents")
      .upload(path, file, { cacheControl: "3600" });

    if (error) {
      toast.error("Помилка завантаження");
    } else {
      toast.success("Документ завантажено!");
      // Log event
      await supabase.from("order_events").insert({
        order_id: order.id,
        event_type: "document_upload",
        description: `Завантажено документ: ${file.name}`,
      });
      fetchFiles();
      fetchEvents();
    }
    setUploading(false);
    e.target.value = "";
  };

  const getFileUrl = (fileName: string) => {
    if (!order) return "";
    const { data } = supabase.storage
      .from("order-documents")
      .getPublicUrl(`${order.id}/${fileName}`);
    return data.publicUrl;
  };

  const isImage = (name: string) =>
    /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(name);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("uk-UA", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const statusInfo = order ? STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-muted" } : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {order && (
          <>
            <SheetHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
                {statusInfo && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                )}
              </div>
              <SheetTitle className="text-left">{order.client_name}</SheetTitle>
            </SheetHeader>

            {/* Order info summary */}
            <div className="py-4 space-y-3 border-b border-border">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-green-400" />
                  <span>{order.origin}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>{order.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="w-3.5 h-3.5" />
                  <span>{order.distance} км • {order.cargo_type}</span>
                </div>
                {driverName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span>{driverName}</span>
                  </div>
                )}
                {order.client_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{order.client_phone}</span>
                  </div>
                )}
                {order.total_price && (
                  <div className="flex items-center gap-2 font-semibold text-green-400">
                    <span>{Number(order.total_price).toLocaleString("uk-UA")} ₴</span>
                  </div>
                )}
              </div>
              {order.notes && (
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  {order.notes}
                </p>
              )}
            </div>

            {/* Tabs: Timeline + Documents */}
            <Tabs defaultValue="timeline" className="mt-4">
              <TabsList className="w-full">
                <TabsTrigger value="timeline" className="flex-1 gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Історія
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex-1 gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Документи ({files.length})
                </TabsTrigger>
              </TabsList>

              {/* Timeline */}
              <TabsContent value="timeline" className="mt-4">
                {loadingEvents ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Подій поки немає
                  </div>
                ) : (
                  <div className="relative space-y-0">
                    {/* Timeline line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

                    {events.map((ev, i) => {
                      const isStatus = ev.event_type === "status_change";
                      const isDoc = ev.event_type === "document_upload";
                      return (
                        <div key={ev.id} className="relative flex gap-3 pb-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                            isStatus ? "bg-secondary/20 text-secondary" :
                            isDoc ? "bg-blue-500/20 text-blue-400" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {isStatus ? <Truck className="w-3 h-3" /> :
                             isDoc ? <FileText className="w-3 h-3" /> :
                             <Clock className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{ev.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatDate(ev.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Documents */}
              <TabsContent value="documents" className="mt-4 space-y-3">
                {/* Upload */}
                <label className="block">
                  <Button variant="outline" className="w-full gap-2" disabled={uploading} asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                      {uploading ? "Завантаження..." : "Завантажити документ (ТТН, CMR)"}
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </span>
                  </Button>
                </label>

                {loadingFiles ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Документів поки немає
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => {
                      const url = getFileUrl(file.name);
                      const img = isImage(file.name);
                      return (
                        <div key={file.id ?? file.name} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                          {img ? (
                            <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                              <img src={url} alt={file.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <File className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{file.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(file.created_at)}
                            </p>
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
