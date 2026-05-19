import { supabase } from "@/lib/supabase/client";
import { KanbanBoard } from "@/components/dispatch/KanbanBoard";

export default async function DispatchBoardPage() {
  // Fetch all orders, joining with customers to get the name
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        customer_name
      )
    `)
    .order('created_at', { ascending: false });

  // Map the joined data to flat objects expected by the Kanban board
  const mappedOrders = (orders || []).map(order => ({
    ...order,
    customer_name: order.customers?.customer_name || 'Unknown'
  }));

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dispatch Board</h2>
          <p className="text-foreground/70 mt-1">Drag and drop orders to update their status.</p>
        </div>
      </div>

      <div className="flex-1">
        <KanbanBoard initialOrders={mappedOrders} />
      </div>
    </div>
  );
}
