"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Target,
  CircleDollarSign,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDate, statusBadgeClass, statusDotClass } from "@/lib/utils";
import {
  useSuppliers,
  useBuyers,
  useProducts,
  useDeals,
  useCommissions,
  useActivityLogs,
  useFollowUps,
} from "@/lib/firebase-store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { format } from "date-fns";
const CHART_COLORS = ["#173F35", "#285B4A", "#C5A46D", "#25865B", "#D99A36"];

export default function DashboardPage() {
  const router = useRouter();
  const { list: suppliers } = useSuppliers();
  const { list: buyers } = useBuyers();
  const { list: products } = useProducts();
  const { list: deals } = useDeals();
  const { list: commissions } = useCommissions();
  const { list: activityLogs } = useActivityLogs();
  const { list: followUps } = useFollowUps();

  const stats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const totalBuyers = buyers.length;
    const activeLeads = buyers.filter(
      (b) =>
        ["New Lead", "Contacted", "Responded", "Qualified"].includes(b.buyerStatus)
    ).length;
    const activeDeals = deals.filter(
      (d) =>
        d.dealStatus === "Prospecting" ||
        d.dealStatus === "Negotiation" ||
        d.dealStatus === "Closed Won" ||
        d.dealStatus === "Closed Lost"
    ).length;
    const totalEstimatedCommission = commissions
      .filter((c) => c.commissionStatus === "Potential")
      .reduce((s, c) => s + c.commissionAmount, 0);
    const commissionReceived = commissions
      .filter((c) => c.commissionStatus === "Paid")
      .reduce((s, c) => s + c.commissionAmount, 0);
    return {
      totalSuppliers,
      totalBuyers,
      activeLeads,
      activeDeals,
      totalEstimatedCommission,
      commissionReceived,
      currencies: [
        {
          id: "total-suppliers",
          label: "Total Suppliers",
          value: totalSuppliers,
          href: "/suppliers",
          icon: Building2,
          color: "#173F35",
          change: "+2 this month",
          numeric: true,
        },
        {
          id: "total-buyers",
          label: "Total Buyers",
          value: totalBuyers,
          href: "/buyers",
          icon: Users,
          color: "#285B4A",
          change: "+1 this month",
          numeric: true,
        },
        {
          id: "active-leads",
          label: "Active Leads",
          value: activeLeads,
          href: "/buyers",
          icon: Target,
          color: "#C5A46D",
          change: "in pipeline",
          numeric: true,
        },
        {
          id: "active-deals",
          label: "Active Deals",
          value: activeDeals,
          href: "/deals",
          icon: CircleDollarSign,
          color: "#25865B",
          change: "negotiating",
          numeric: true,
        },
        {
          id: "estimated-commission",
          label: "Est. Commission",
          value: totalEstimatedCommission,
          href: "/commissions",
          icon: TrendingUp,
          color: "#D9534F",
          change: "potential",
          currency: "IDR",
          numeric: false,
        },
        {
          id: "commission-received",
          label: "Commission Received",
          value: commissionReceived,
          href: "/commissions",
          icon: CircleDollarSign,
          color: "#173F35",
          change: "paid",
          currency: "IDR",
          numeric: false,
        },
      ],
    };
  }, [suppliers, buyers, deals, commissions]);

  const buyerAcquisitionChart = useMemo(() => {
    const byStatus = buyers.reduce(
      (acc, b) => {
        acc[b.buyerStatus] = (acc[b.buyerStatus] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(byStatus).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [buyers]);

  const dealPipelineChart = useMemo(() => {
    const byStage = deals.reduce(
      (acc, d) => {
        acc[d.dealStatus] = (acc[d.dealStatus] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(byStage).map(([stage, count]) => ({
      name: stage,
      value: count,
    }));
  }, [deals]);

  const commissionChart = useMemo(() => {
    const byStatus = commissions.reduce(
      (acc, c) => {
        acc[c.commissionStatus] =
          (acc[c.commissionStatus] ?? 0) + c.commissionAmount;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(byStatus)
      .map(([status, value]) => ({ name: status, value }))
      .filter((d) => d.value > 0);
  }, [commissions]);

  const recentBuyers = useMemo(
    () =>
      [...buyers]
        .sort(
          (a, b) =>
            new Date(b.lastContact || b.nextFollowUp).getTime() -
            new Date(a.lastContact || a.nextFollowUp).getTime()
        )
        .slice(0, 5),
    [buyers]
  );

  const recentSuppliers = useMemo(
    () =>
      [...suppliers]
        .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
        .slice(0, 5),
    [suppliers]
  );

  const upcomingFollowups = useMemo(() => {
    return followUps
      .filter(
        (f) =>
          f.scheduledAt &&
          !f.completedAt &&
          f.demo !== false &&
          new Date(f.scheduledAt) > new Date()
      )
      .slice(0, 5)
      .map((f) => {
        try {
          return {
            ...f,
            date: format(new Date(f.scheduledAt), "dd LLL yyyy"),
            overdue: new Date(f.scheduledAt) < new Date(),
          };
        } catch {
          return { ...f, date: f.scheduledAt, overdue: false };
        }
      });
  }, [followUps]);

  const activeDealsList = useMemo(() => {
    return deals
      .filter(
        (d) =>
          d.dealStatus === "Prospecting" ||
          d.dealStatus === "Negotiation"
      )
      .slice(0, 5);
  }, [deals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#333] mt-1">
            Overview of Harsa Reka Niaga business activities.
            <br />
            
          </p>
        </div>      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.currencies.map((stat) => (
          <Card
            key={stat.id}
            className="group cursor-pointer transition-all hover:border-brand-forest/30 hover:shadow-sm"
            style={{ borderColor: "var(--brand-border)" }}
            onClick={() => router.push(stat.href)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[#333] uppercase tracking-wider">
                    {stat.label}
                  </p>
                  {stat.currency === "IDR" ? (
                    <p className="text-lg font-semibold text-black mt-1">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                        minimumFractionDigits: 0,
                      }).format(stat.value)}
                    </p>
                  ) : (
                    <p className="text-lg font-semibold text-black mt-1">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      }).format(stat.value)}
                    </p>
                  )}
                  <p className="text-xs text-[#333] mt-1 flex items-center gap-1">
                    <span>{stat.change}</span>
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-[4px] flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}18` }}
                >
                  <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-black">
              Buyer Acquisition Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {buyerAcquisitionChart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#333]">
                  No buyer data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={buyerAcquisitionChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {buyerAcquisitionChart.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E6EAE5",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-3 space-y-1">
              {buyerAcquisitionChart.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-[#333]">{item.name}</span>
                  <span className="font-medium text-brand-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-black">
              Deal Pipeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {dealPipelineChart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#333]">
                  No deals yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dealPipelineChart}
                    layout="vertical"
                    margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 11, fill: "#78847E" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E6EAE5",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#173F35"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-black">
              Commission Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {commissionChart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#333]">
                  No commission data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={commissionChart}
                    margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#78847E" }}
                      interval={0}
                      tickCount={5}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#78847E" }}
                      tickFormatter={(v) =>
                        v >= 1000000
                          ? `${(v / 1000000).toFixed(1)}M`
                          : v >= 1000
                            ? `${(v / 1000).toFixed(0)}K`
                            : String(v)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E6EAE5",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#C5A46D"
                      strokeWidth={2}
                      dot={{ fill: "#C5A46D", strokeWidth: 2, r: 3 }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#285B4A"
                      radius={[4, 4, 0, 0]}
                      opacity={0.85}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column lower section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent buyers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-black">
              Recent Buyers
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-black text-xs"
              onClick={() => router.push("/buyers")}
            >
              View all
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentBuyers.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#333]">
                No buyers yet. Add your first buyer to start building the pipeline.
              </div>
            ) : (
              <div className="space-y-3">
                {recentBuyers.map((buyer) => (
                  <Link
                    key={buyer.id}
                    href={`/buyers/${buyer.id}`}
                    className="flex items-center justify-between p-2.5 rounded-[4px] border border-transparent hover:border-black hover:bg-brand-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            statusDotClass(buyer.buyerStatus)
                          )}
                        />
                        <span className="text-sm font-medium truncate">
                          {buyer.companyName}
                        </span>
                      </div>
                      <p className="text-xs text-[#333] truncate mt-0.5">
                        {buyer.contactPerson} · {buyer.country}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[11px]",
                          statusBadgeClass(buyer.buyerStatus)
                        )}
                      >
                        {buyer.buyerStatus}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently added suppliers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-black">
              Recently Added Suppliers
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-black text-xs"
              onClick={() => router.push("/suppliers")}
            >
              View all
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentSuppliers.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#333]">
                No suppliers yet. Add your first supplier to start sourcing.
              </div>
            ) : (
              <div className="space-y-3">
                {recentSuppliers.map((supplier) => (
                  <Link
                    key={supplier.id}
                    href={`/suppliers/${supplier.id}`}
                    className="flex items-center justify-between p-2.5 rounded-[4px] border border-transparent hover:border-black hover:bg-brand-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            statusDotClass(supplier.verificationStatus)
                          )}
                        />
                        <span className="text-sm font-medium truncate">
                          {supplier.companyName}
                        </span>
                      </div>
                      <p className="text-xs text-[#333] truncate mt-0.5">
                        {supplier.supplierType} · {supplier.country}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[11px]",
                          statusBadgeClass(supplier.verificationStatus)
                        )}
                      >
                        {supplier.verificationStatus}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming follow-ups and active deals row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming follow-ups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-black">
              Upcoming Follow-ups
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-black text-xs"
              onClick={() => router.push("/buyers")}
            >
              Manage follow-ups
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingFollowups.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#333]">
                No upcoming follow-ups scheduled.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingFollowups.map((f) => {
                  const buyer = buyers.find((b) => b.id === f.buyerId);
                  return (
                    <div
                      key={f.id}
                      className="flex items-start gap-3 p-2.5 rounded-[4px] border border-transparent hover:border-black hover:bg-brand-muted/30 transition-colors"
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          f.overdue ? "bg-red-500" : "bg-amber-500"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {f.note}
                        </p>
                        <p className="text-xs text-[#333] mt-0.5">
                          {buyer ? `${buyer.companyName}` : ""}
                          {f.overdue ? " · Overdue" : ""}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[11px]",
                          f.overdue
                            ? "bg-red-50 text-red-800 border-red-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        )}
                      >
                        {f.date}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-black">
              Active Deals
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-black text-xs"
              onClick={() => router.push("/deals")}
            >
              View all deals
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {activeDealsList.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#333]">
                No active deals in the pipeline.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Deal</TableHead>
                    <TableHead className="text-xs">Buyer</TableHead>
                    <TableHead className="text-xs">Value</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Expected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeDealsList.map((deal) => {
                    const buyer = buyers.find((b) => b.id === deal.buyerId);
                    return (
                      <TableRow
                        key={deal.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/deals/${deal.id}`)}
                      >
                        <TableCell className="text-sm font-medium">
                          {deal.name}
                        </TableCell>
                        <TableCell className="text-sm text-[#333]">
                          {buyer?.companyName ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {deal.currency === "IDR"
                            ? new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                maximumFractionDigits: 0,
                              }).format(deal.dealValue)
                            : new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                maximumFractionDigits: 2,
                              }).format(deal.dealValue)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[11px]",
                              statusBadgeClass(deal.dealStatus)
                            )}
                          >
                            {deal.dealStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[#333]">
                          {formatDate(deal.expectedClose)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-black">
            Recent Business Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#333]">
              No recent activity.
            </div>
          ) : (
            <div className="space-y-2">
              {activityLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-2.5 rounded-[4px] border border-transparent hover:border-black hover:bg-brand-muted/30 transition-colors"
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs border shrink-0",
                      statusBadgeClass(log.action)
                    )}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3" />
                      {log.action.toLowerCase().includes("status") ||
                      log.action.toLowerCase().includes("moved") ? (
                        <path d="M12 8v4l2 2" />
                      ) : log.action.toLowerCase().includes("created") ||
                        log.action.toLowerCase().includes("added") ? (
                        <>
                          <path d="M12 5v14M5 12h14" />
                        </>
                      ) : log.action.toLowerCase().includes("payment") ||
                        log.action.toLowerCase().includes("received") ? (
                        <>
                          <path d="M12 2v20M17 7l-5-5-5 5" />
                        </>
                      ) : (
                        <>
                          <path d="M12 2v20M5 12h14" />
                        </>
                      )}
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-brand-foreground">
                      {log.description}
                    </p>
                    <p className="text-xs text-[#333] mt-0.5">
                      {formatDate(log.createdAt, "dd MMM yyyy HH:mm")}
                      {" · "}
                      <Badge variant="secondary" className="text-[10px] py-0">
                        {log.entity}
                      </Badge>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
