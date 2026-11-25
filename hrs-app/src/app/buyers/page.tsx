"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  X,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Users,
  Mail,
  Phone,
  Globe,
  Award,
  Calendar,
  Clock,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn, formatDate, statusBadgeClass, statusDotClass, shortId } from "@/lib/utils";
import {
  useBuyers,
  useProducts,
  useSuppliers,
  useFollowUps,
  useBuyerInteractions,
  useActivityLogs,
  useDeals,
  useCommissions,
} from "@/lib/firebase-store";
import type { Buyer, BuyerStatus, BuyerInteraction } from "@/lib/data";
import { v4 as uuid } from "uuid";

const BUYER_STATUSES: BuyerStatus[] = [
  "New Lead",
  "Contacted",
  "Responded",
  "Qualified",
  "Negotiation",
  "Proposal Sent",
  "Won",
  "Lost",
];

const PIPELINE_STAGES: { status: BuyerStatus; label: string }[] = [
  { status: "New Lead", label: "New Leads" },
  { status: "Contacted", label: "Contacted" },
  { status: "Responded", label: "Responded" },
  { status: "Qualified", label: "Qualified" },
  { status: "Negotiation", label: "Negotiation" },
  { status: "Proposal Sent", label: "Proposal Sent" },
  { status: "Won", label: "Won" },
  { status: "Lost", label: "Lost" },
];

const INITIAL_FORM: Omit<Buyer, "id" | "demo"> = {
  companyName: "",
  contactPerson: "",
  country: "",
  city: "",
  website: "",
  email: "",
  whatsapp: "",
  interestedProducts: [],
  estimatedOrderVolume: "",
  leadSource: "",
  buyerStatus: "New Lead",
  lastContact: "",
  nextFollowUp: "",
};

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-black rounded-[4px] bg-brand-muted/20">
      <div className="w-12 h-12 rounded-full bg-brand-forest/10 flex items-center justify-center mb-4">
        <Users className="w-6 h-6 text-black" />
      </div>
      <h3 className="text-base font-semibold text-black mb-1">No buyers yet</h3>
      <p className="text-sm text-[#333] max-w-xs">
        Add your first buyer to start building the pipeline.
      </p>
      <Button className="mt-4" onClick={onAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Add Buyer
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-black rounded-[4px]">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[120px]" />
          </div>
          <Skeleton className="h-6 w-[80px]" />
        </div>
      ))}
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  buyers,
  onMove,
}: {
  status: BuyerStatus;
  label: string;
  buyers: Buyer[];
  onMove: (buyerId: string, newStatus: BuyerStatus) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, buyerId: string) => {
    setDragging(buyerId);
    e.dataTransfer.setData("buyerId", buyerId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const buyerId = e.dataTransfer.getData("buyerId");
    if (buyerId && dragging !== buyerId) {
      onMove(buyerId, status);
    }
    setDragging(null);
  };

  return (
    <div className="flex flex-col min-w-[180px] md:min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              status === "Won"
                ? "bg-emerald-500"
                : status === "Lost"
                  ? "bg-red-500"
                  : "bg-sky-500"
            )}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#333]">
            {label}
          </span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-transparent border-0">
          {buyers.length}
        </Badge>
      </div>
      <ScrollArea className="h-[calc(100vh-280px)] min-h-[120px] rounded-[4px] border border-black bg-brand-muted/20 p-1">
        <div className="space-y-1">
          {buyers.map((buyer) => (
            <div
              key={buyer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, buyer.id)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                "p-2 rounded-[4px] border border-transparent cursor-grab transition-colors",
                buyer.id === dragging
                  ? "border-brand-gold bg-brand-gold/10 shadow-sm"
                  : "border-black bg-[#fffdf5] hover:border-black/60 hover:bg-brand-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-forest/10 flex items-center justify-center text-[10px] font-semibold text-black">
                  {shortId(buyer.id)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{buyer.companyName}</div>
                  <div className="text-xs text-[#333] truncate">{buyer.contactPerson || "—"}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  {buyer.buyerStatus}
                </Badge>
              </div>
            </div>
          ))}
          {buyers.length === 0 && (
            <div className="text-xs text-[#333] text-center py-4 px-2 border border-dashed border-black rounded-[4px]">
              No buyers
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function BuyersPage() {
  const router = useRouter();
  const { list: buyers, add, update, remove, refresh } = useBuyers();
  const { list: followUps } = useFollowUps();
  const { list: interactions } = useBuyerInteractions();
  const { list: activityLogs } = useActivityLogs();
  const { list: deals } = useDeals();
  const { list: commissions } = useCommissions();
  const { add: addActivityLog } = useActivityLogs();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BuyerStatus | "">("");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [productInput, setProductInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Buyer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [detailBuyerId, setDetailBuyerId] = useState<string | null>(null);

  const categories = form.interestedProducts;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...buyers];
    if (q) {
      rows = rows.filter(
        (b) =>
          b.companyName.toLowerCase().includes(q) ||
          b.contactPerson.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.country.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.leadSource.toLowerCase().includes(q) ||
          b.interestedProducts.some((p) => p.toLowerCase().includes(q))
      );
    }
    if (statusFilter) rows = rows.filter((b) => b.buyerStatus === statusFilter);
    return rows;
  }, [buyers, search, statusFilter]);

  const kanbanBuyers = useMemo(() => {
    return PIPELINE_STAGES.map(({ status }) => ({
      status,
      buyers: buyers.filter((b) => b.buyerStatus === status),
    }));
  }, [buyers]);

  const handleDragEnd = (buyerId: string, newStatus: BuyerStatus) => {
    const buyer = buyers.find((b) => b.id === buyerId);
    if (buyer && buyer.buyerStatus !== newStatus) {
      update(buyerId, { buyerStatus: newStatus });
      logBuyer("Buyer status changed", buyer.companyName, buyerId);
      refresh();
      setToast({ message: `Moved to ${newStatus}`, type: "success" });
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setProductInput("");
  };

  const handleOpen = (buyer?: Buyer) => {
    if (buyer) {
      setEditingId(buyer.id);
      setForm({
        companyName: buyer.companyName,
        contactPerson: buyer.contactPerson,
        country: buyer.country,
        city: buyer.city,
        website: buyer.website,
        email: buyer.email,
        whatsapp: buyer.whatsapp,
        interestedProducts: [...buyer.interestedProducts],
        estimatedOrderVolume: buyer.estimatedOrderVolume,
        leadSource: buyer.leadSource,
        buyerStatus: buyer.buyerStatus,
        lastContact: buyer.lastContact,
        nextFollowUp: buyer.nextFollowUp,
      });
      setProductInput("");
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleProductAdd = () => {
    const val = productInput.trim();
    if (val && !categories.includes(val)) {
      setForm((f) => ({ ...f, interestedProducts: [...f.interestedProducts, val] }));
    }
    setProductInput("");
  };

  const handleProductRemove = (prod: string) => {
    setForm((f) => ({ ...f, interestedProducts: f.interestedProducts.filter((p) => p !== prod) }));
  };

  const logBuyer = (action: "Buyer created" | "Buyer updated" | "Buyer status changed", companyName: string, entityId: string) => {
    addActivityLog({
      id: uuid(),
      action,
      entity: "Buyer",
      entityId,
      description: `${action} — ${companyName}`,
      createdAt: new Date().toISOString(),
      demo: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
      };
      if (editingId) {
        update(editingId, payload);
        logBuyer("Buyer updated", form.companyName, editingId);
        setToast({ message: "Buyer updated successfully", type: "success" });
      } else {
        const id = uuid();
        add({
          ...payload,
          id,
          demo: true,
        });
        logBuyer("Buyer created", form.companyName, id);
        setToast({ message: "Buyer added successfully", type: "success" });
      }
      setDialogOpen(false);
      resetForm();
      refresh();
    } catch {
      setToast({ message: "Failed to save buyer", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setLoading(true);
    remove(deleteTarget.id);
    logBuyer("Buyer updated", deleteTarget.companyName, deleteTarget.id);
    setToast({ message: "Buyer deleted", type: "success" });
    setDeleteTarget(null);
    setConfirmDelete(false);
    setLoading(false);
    refresh();
  };

  const buyerInteractions = useMemo(() => {
    return interactions.filter((i) => i.buyerId === detailBuyerId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [interactions, detailBuyerId]);

  const buyerFollowUps = useMemo(() => {
    return followUps.filter((f) => f.buyerId === detailBuyerId).sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }, [followUps, detailBuyerId]);

  const buyerDeals = useMemo(() => {
    return deals.filter((d) => d.buyerId === detailBuyerId);
  }, [deals, detailBuyerId]);

  const buyerCommissions = useMemo(() => {
    return commissions.filter((c) => c.buyerId === detailBuyerId);
  }, [commissions, detailBuyerId]);

  const detailBuyer = useMemo(() => {
    return buyers.find((b) => b.id === detailBuyerId);
  }, [buyers, detailBuyerId]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-[4px] bg-brand-forest text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-black tracking-tight">Buyers</h1>
              <p className="text-sm text-[#333] mt-1">
                Manage prospective international buyers and business leads.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">            <Button
              variant="outline"
              onClick={() => setView(view === "table" ? "kanban" : "table")}
            >
              {view === "table" ? "Kanban" : "Table"}
            </Button>
            <Button onClick={() => handleOpen()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Buyer
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]" />
            <Input
              className="pl-9"
              placeholder="Search buyers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#333] hover:text-black"
                onClick={() => setSearch("")}
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BuyerStatus | "")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {BUYER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {statusFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("")}
            >
              <X className="w-4 h-4 mr-1" />
              Clear filter
            </Button>
          )}
        </div>

        {/* View toggle */}
        <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban")}>
          <TabsList className="w-auto bg-transparent px-1">
            <TabsTrigger value="table" className="text-xs">List</TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-0">
            {/* Table */}
            <div className="border border-black rounded-[4px] overflow-hidden bg-[#fffdf5] shadow-sm">
              {loading ? (
                <LoadingState />
              ) : filtered.length === 0 ? (
                <EmptyState onAdd={() => handleOpen()} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-muted/40">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                        Company
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                        Contact
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                        Country
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                        Lead Source
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                        Next Follow-up
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333] w-[70px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((buyer) => (
                      <TableRow
                        key={buyer.id}
                        className="cursor-pointer border-b border-black last:border-0 hover:bg-brand-muted/30 transition-colors"
                        onClick={() => {
                          setDetailBuyerId(buyer.id);
                          router.push(`/buyers/${buyer.id}`);
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-brand-forest/10 flex items-center justify-center text-black shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{buyer.companyName}</div>
                              <div className="text-xs text-[#333] truncate max-w-[180px]">
                                {buyer.email || "—"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm truncate max-w-[160px]">{buyer.contactPerson || "—"}</div>
                          <div className="text-xs text-[#333] truncate max-w-[160px]">{buyer.whatsapp || "—"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Globe className="w-3.5 h-3.5 text-[#333] shrink-0" />
                            <span className="truncate">{buyer.country}{buyer.city ? `, ${buyer.city}` : ""}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-[#333]">
                          {buyer.leadSource || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("text-[11px]", statusBadgeClass(buyer.buyerStatus))}
                          >
                            {buyer.buyerStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[#333]">
                          {formatDate(buyer.nextFollowUp)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              }
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailBuyerId(buyer.id);
                                  router.push(`/buyers/${buyer.id}`);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleOpen(buyer); }}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(buyer);
                                  setConfirmDelete(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="kanban" className="mt-0">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {kanbanBuyers.map(({ status, buyers: columnBuyers }) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  label={PIPELINE_STAGES.find((s) => s.status === status)?.label ?? status}
                  buyers={columnBuyers}
                  onMove={(buyerId, newStatus) => handleDragEnd(buyerId, newStatus)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Results count */}
        <div className="text-xs text-[#333] flex items-center gap-1">
          Showing {filtered.length} of {buyers.length} buyers
        </div>

        {/* Add / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-full max-w-[640px] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-2 border-b border-black">
              <DialogTitle className="text-lg font-semibold text-black flex items-center gap-2">
                <Users className="w-5 h-5" />
                {editingId ? "Edit Buyer" : "Add Buyer"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the buyer details below."
                  : "Fill in the buyer information. Fill in the information below."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Meridian Trading Co."
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="leadSource">Lead Source</Label>
                  <Input
                    id="leadSource"
                    value={form.leadSource}
                    onChange={(e) => setForm({ ...form, leadSource: e.target.value })}
                    placeholder="Trade fair"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Daniel Vos"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="South Korea"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Busan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="estimatedOrderVolume">Estimated Order Volume</Label>
                  <Input
                    id="estimatedOrderVolume"
                    value={form.estimatedOrderVolume}
                    onChange={(e) => setForm({ ...form, estimatedOrderVolume: e.target.value })}
                    placeholder="5 tons/month"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="buyer@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="+82 10 0000 1111"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Buyer Status</Label>
                  <Select
                    value={form.buyerStatus}
                    onValueChange={(v) => setForm({ ...form, buyerStatus: v as BuyerStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUYER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lastContact">Last Contact</Label>
                  <Input
                    id="lastContact"
                    type="date"
                    value={form.lastContact}
                    onChange={(e) => setForm({ ...form, lastContact: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nextFollowUp">Next Follow-up</Label>
                  <Input
                    id="nextFollowUp"
                    type="date"
                    value={form.nextFollowUp}
                    onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Interested Products</Label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((p) => (
                    <Badge
                      key={p}
                      variant="secondary"
                      className="text-xs px-2 py-1 cursor-pointer hover:bg-brand-muted"
                      onClick={() => handleProductRemove(p)}
                    >
                      {p}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleProductAdd();
                      }
                    }}
                    placeholder="Add a product..."
                  />
                  <Button type="button" variant="outline" onClick={handleProductAdd}>
                    Add
                  </Button>
                </div>
              </div>



              <div className="flex justify-end gap-2 pt-2 border-t border-black">
                <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingId ? "Update Buyer" : "Add Buyer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
          <DialogContent className="w-full max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-red-700">
                Delete buyer?
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium">{deleteTarget?.companyName}</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? <Spinner className="w-4 h-4" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 w-[380px]">
            <div className="flex items-center gap-2 p-3 rounded-[4px] bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm">{toast.message}</span>
              <button className="ml-auto text-emerald-600 hover:text-emerald-800" onClick={() => setToast(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
