import { createClient } from "@/lib/supabase/server";
import { createApiClient } from "@/lib/api-client";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DiscoveryRow {
  id: string;
  crop: string;
  region: string;
  status: "pending" | "running" | "completed" | "error";
  sourcesFound: number;
  lastDiscoveredAt: string | null;
  createdAt: string;
}

interface DiscoveryStatusResponse {
  stats: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    error: number;
  };
  progress: {
    pct: number;
    sourcesTotal: number;
  };
  rows: DiscoveryRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_BADGE: Record<
  DiscoveryRow["status"],
  { label: string; variant: "secondary" | "outline" | "default" | "destructive" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  running: { label: "Running", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
  error: { label: "Error", variant: "destructive" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DiscoveryStatusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const client = createApiClient(session?.access_token ?? "");

  const [statusResult] = await Promise.allSettled([
    client.get<DiscoveryStatusResponse>(
      "/api/v1/admin/discovery/status?pageSize=200"
    ),
  ]);

  const data =
    statusResult.status === "fulfilled" ? statusResult.value : null;

  const stats = data?.stats ?? {
    total: 600,
    pending: 600,
    running: 0,
    completed: 0,
    error: 0,
  };
  const progress = data?.progress ?? { pct: 0, sourcesTotal: 0 };
  const rows = data?.rows ?? [];

  return (
    <div className="container max-w-6xl py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discovery Pipeline</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {stats.total} crop × region combinations · runs every 30 minutes via Gemini 2.5 Flash
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Pending", value: stats.pending, color: "text-muted-foreground" },
          { label: "Running", value: stats.running, color: "text-blue-600" },
          { label: "Completed", value: stats.completed, color: "text-green-600" },
          { label: "Error", value: stats.error, color: "text-destructive" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="text-center py-2">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className={`text-2xl font-bold ${color}`}>{value}</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium">
              {progress.pct}% complete
            </span>
            <span className="text-muted-foreground">
              {progress.sourcesTotal.toLocaleString()} sources registered
            </span>
          </div>
          <Progress value={progress.pct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.completed} of {stats.total} combinations processed ·{" "}
            {stats.error > 0 && `${stats.error} failed (will retry) · `}
            ~{Math.ceil((stats.total - stats.completed) / 20)} runs remaining at current pace
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Combinations
            {data?.pagination && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({data.pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              {statusResult.status === "rejected"
                ? "Could not load discovery data — API Gateway may not be configured."
                : "No combinations found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Crop</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Region</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Sources</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Last Run</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden lg:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const badge = STATUS_BADGE[row.status];
                    return (
                      <tr
                        key={row.id}
                        className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                      >
                        <td className="px-4 py-2 font-medium capitalize">{row.crop}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.region}</td>
                        <td className="px-4 py-2">
                          <Badge variant={badge.variant} className="text-xs">
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {row.sourcesFound > 0 ? (
                            <span className="text-green-600 font-medium">{row.sourcesFound}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">
                          {formatDate(row.lastDiscoveredAt)}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground text-xs hidden lg:table-cell">
                          {formatDate(row.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
