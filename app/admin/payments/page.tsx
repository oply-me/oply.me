import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const db = createAdminClient();

  const { data: events } = await db
    .from("payment_events")
    .select(
      "id, provider, provider_event_id, event_type, order_id, processed, processed_at, error, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.022em]">
          Payment events
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verified webhooks received from the payment provider. The event ID
          carries a unique constraint, which is what makes a replayed webhook
          harmless. Raw payloads are stored but not displayed.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Event ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Processed</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(events ?? []).map((event) => (
              <TableRow key={event.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDateTime(event.created_at)}
                </TableCell>
                <TableCell className="text-xs">{event.provider}</TableCell>
                <TableCell className="max-w-[180px] truncate font-mono text-xs">
                  {event.provider_event_id}
                </TableCell>
                <TableCell className="text-xs">{event.event_type ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {event.order_id?.slice(0, 8) ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={event.processed ? "success" : "warning"}>
                    {event.processed ? "Processed" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-xs text-destructive">
                  {event.error ?? ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(events ?? []).length === 0 && (
          <p className="py-14 text-center text-sm text-muted-foreground">
            No payment events received yet.
          </p>
        )}
      </div>
    </div>
  );
}
