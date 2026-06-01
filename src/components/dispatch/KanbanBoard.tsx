"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { RefreshCw } from "lucide-react";

type Order = {
  id: string;
  order_id: string;
  customer_name: string;
  vehicle_name: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  carrier_price: number;
  customer_price: number;
  profit: number;
  notes: string;
};

const COLUMNS = ["Posted", "Dispatched", "Picked Up", "Delivered"];

export function KanbanBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    const { data } = await supabase
      .from("orders")
      .select(`*, customers(customer_name)`)
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data.map((o: any) => ({
        ...o,
        customer_name: o.customers?.customer_name || "Unknown"
      })));
    }
    if (showSpinner) setRefreshing(false);
  }, []);

  // Auto-refresh every 15 seconds to pick up newly created orders
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedOrderId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedOrderId) return;

    setOrders((prev) =>
      prev.map((order) =>
        order.id === draggedOrderId ? { ...order, status: newStatus } : order
      )
    );

    await supabase.from("orders").update({ status: newStatus }).eq("id", draggedOrderId);
    setDraggedOrderId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-3 shrink-0">
        <button
          onClick={() => fetchOrders(true)}
          className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-foreground/5 transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Board"}
        </button>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
        {COLUMNS.map((column) => {
          const columnOrders = orders.filter(
            (o) => (o.status || "Posted").toLowerCase() === column.toLowerCase()
          );

          return (
            <div
              key={column}
              className="flex-shrink-0 w-80 flex flex-col bg-surface/50 rounded-2xl border border-border overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column)}
            >
              <div className="p-4 border-b border-border bg-background/50 flex justify-between items-center">
                <h3 className="font-bold text-foreground">{column}</h3>
                <span className="bg-foreground/10 text-foreground text-xs font-semibold px-2 py-1 rounded-full">
                  {columnOrders.length}
                </span>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {columnOrders.map((order) => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    className="glass-panel p-4 rounded-xl border border-border cursor-grab active:cursor-grabbing hover:border-neon-blue/50 transition-colors bg-surface shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-neon-blue">{order.order_id}</span>
                      <span className="text-xs font-semibold text-green-500">${order.profit || 0}</span>
                    </div>
                    <p className="font-medium text-sm text-foreground mb-1">{order.customer_name || "Unknown Customer"}</p>
                    <p className="text-xs text-foreground/70 mb-3">{order.vehicle_name}</p>

                    <div className="text-xs space-y-1 mb-3 bg-background/50 p-2 rounded">
                      <div className="truncate text-foreground/80"><span className="text-foreground/50">From:</span> {order.pickup_location}</div>
                      <div className="truncate text-foreground/80"><span className="text-foreground/50">To:</span> {order.dropoff_location}</div>
                    </div>

                    {order.notes && (
                      <p className="text-xs text-foreground/60 italic truncate">"{order.notes}"</p>
                    )}
                  </div>
                ))}

                {columnOrders.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl text-foreground/40 text-sm">
                    Drop orders here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
