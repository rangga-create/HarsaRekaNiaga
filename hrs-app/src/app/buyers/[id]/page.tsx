"use client";

import { useState, useMemo, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  CircleDot,
  X,
  History,
  TrendingUp,
  Package,
  Tag,
  Award,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn, formatDate, statusBadgeClass, statusDotClass } from "@/lib/utils";
import {
  useBuyers,
  useBuyerInteractions,
  useFollowUps,
  useProducts,
  useSuppliers,
  useDeals,
  useCommissions,
  useActivityLogs,
} from "@/lib/firebase-store";
import type { BuyerStatus, BuyerInteraction, FollowUp } from "@/lib/data";
import { v4 as uuid } from "uuid";

const INTERACTION_TYPES = ["Call", "Email", "WhatsApp", "Meeting", "Note"] as const;
type InteractionType = (typeof INTERACTION_TYPES)[number];

const PIPELINE_STAGES = [
  "New Lead",
  "Contacted",
  "Responded",
  "Qualified",
  "Negotiation",
  "Proposal Sent",
  "Won",
  "Lost",
] as const;

function EmptyInteractions() {
  return (
    <div className="py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-brand-muted/40 flex items-center justify-center mx-auto mb-2">
        <MessageSquare className="w-5 h-5 text-[#333]" />
      </div>
      <p className="text-sm text-[#333]">No interactions yet.</p>
    </div>
  );
}

function EmptyFollowUps() {
  return (
    <div className="py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-brand-muted/40 flex items-center justify-center mx-auto mb-2">
        <Clock className="w-5 h-5 text-[#333]" />
      </div>
      <p className="text-sm text-[#333]">No follow-ups scheduled.</p>
    </div>
  );
}

export default function BuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: buyerId } = use(params);
  const { list: buyers, update, remove, refresh } = useBuyers();
  const {
    list: interactions,
    add: addInteraction,
  } = useBuyerInteractions();
  const {
    list: followUps,
    add: addFollowUp,
    update: updateFollowUp,
    remove: removeFollowUp,
  } = useFollowUps();
  const { list: products } = useProducts();
  const { list: suppliers } = useSuppliers();
  const { list: deals } = useDeals();
  const { list: commissions } = useCommissions();
  const { add: addActivityLog } = useActivityLogs();

  const [loading, setLoading] = useState(false);
  const [renderTime] = useState(() => Date.now());
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interactionForm, setInteractionForm] = useState<
    Omit<BuyerInteraction, "id" | "demo">
  >({ buyerId: "", type: "Note", note: "", createdAt: "" });
  const [followUpForm, setFollowUpForm] = useState<
    Omit<FollowUp, "id" | "demo" | "createdBy"> & { completedAt: string | null }
  >({ buyerId: "", note: "", scheduledAt: "", completedAt: null });
  const [newStatus, setNewStatus] = useState<BuyerStatus | "">("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const buyer = useMemo(() => buyers.find((b) => b.id === buyerId), [buyers, buyerId]);

  const buyerInteractions = useMemo(
    () =>
      interactions.filter((i) => i.buyerId === buyerId).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [interactions, buyerId]
  );

  const buyerFollowUps = useMemo(
    () =>
      followUps
        .filter((f) => f.buyerId === buyerId)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [followUps, buyerId]
  );

  const buyerDeals = useMemo(
    () => deals.filter((d) => d.buyerId === buyerId),
    [buyerId]
  );

  const buyerCommissions = useMemo(
    () => commissions.filter((c) => c.buyerId === buyerId),
    [buyerId]
  );

  const buyerProducts = useMemo(
    () => products.filter((p) => p.associatedSupplierId !== ""),
    [products]
  );

  const relatedSuppliers = useMemo(() => {
    const supIds = new Set<string>();
    buyerDeals.forEach((d) => supIds.add(d.supplierId));
    return suppliers.filter((s) => supIds.has(s.id));
  }, [buyerDeals, suppliers]);

  const interactionTypeIcon = (type: string) => {
    switch (type) {
      case "Call":
        return <Phone className="w-4 h-4 text-black" />;
      case "Email":
        return <Mail className="w-4 h-4 text-black" />;
      case "WhatsApp":
        return <Phone className="w-4 h-4 text-emerald-600" />;
      case "Meeting":
        return <Calendar className="w-4 h-4 text-black" />;
      case "Note":
        return <FileText className="w-4 h-4 text-black" />;
      default:
        return <MessageSquare className="w-4 h-4 text-[#333]" />;
    }
  };

  const openInteractionDialog = () => {
    setInteractionForm({ buyerId, type: "Note", note: "", createdAt: new Date().toISOString() });
    setInteractionDialogOpen(true);
  };

  const openFollowUpDialog = () => {
    setFollowUpForm({ buyerId, note: "", scheduledAt: "", completedAt: null });
    setFollowUpDialogOpen(true);
  };

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionForm.buyerId) return;
    setLoading(true);
    try {
      addInteraction({
        ...interactionForm,
        id: uuid(),
        demo: true,
      });
      setToast({ message: "Interaction added", type: "success" });
      setInteractionDialogOpen(false);
      void refresh();
    } catch {
      setToast({ message: "Failed to save interaction", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpForm.buyerId || !followUpForm.scheduledAt) return;
    setLoading(true);
    try {
      addFollowUp({
        ...followUpForm,
        id: uuid(),
        createdBy: "user-a",
        demo: true,
      });
      setToast({ message: "Follow-up scheduled", type: "success" });
      setFollowUpDialogOpen(false);
      void refresh();
    } catch {
      setToast({ message: "Failed to schedule follow-up", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteFollowUp = (followUpId: string) => {
    const fu = buyerFollowUps.find((f) => f.id === followUpId);
    if (!fu) return;
    updateFollowUp(followUpId, { completedAt: new Date().toISOString() });
    setToast({ message: "Follow-up completed", type: "success" });
    void refresh();
  };

  const handleDeleteFollowUp = (followUpId: string) => {
    const fu = buyerFollowUps.find((f) => f.id === followUpId);
    if (!fu) return;
    removeFollowUp(followUpId);
    setToast({ message: "Follow-up removed", type: "success" });
    void refresh();
  };

  const handleStatusChange = () => {
    if (!buyer || !newStatus) return;
    setLoading(true);
    try {
      update(buyer.id, { buyerStatus: newStatus });
      setToast({ message: `Status changed to ${newStatus}`, type: "success" });
      setStatusDialogOpen(false);
      setNewStatus("");
      void refresh();
    } catch {
      setToast({ message: "Failed to update status", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!buyer) return;
    setLoading(true);
    remove(buyer.id);
    setToast({ message: "Buyer deleted", type: "success" });
    setDeleteDialogOpen(false);
    setConfirmDelete(false);
    setLoading(false);
    router.push("/buyers");
    void refresh();
  };

  if (!buyer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-forest/10 flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-black" />
        </div>
        <h2 className="text-xl font-semibold text-black mb-1">Buyer not found</h2>
        <p className="text-sm text-[#333] mb-4">
          This buyer may have been deleted or the record doesn&apos;t exist.
        </p>
        <Button onClick={() => router.push("/buyers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Buyers
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push("/buyers")}
              className="mt-1 p-1.5 rounded-[4px] hover:bg-brand-muted/40 transition-colors -ml-1"
            >
              <ArrowLeft className="w-5 h-5 text-[#333]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-forest/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-black tracking-tight">
                    {buyer.companyName}
                  </h1>
                </div>
                <p className="text-sm text-[#333] mt-1 flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full", statusDotClass(buyer.buyerStatus))} />
                  {buyer.buyerStatus}
                  <span className="mx-1.5 text-brand-border">·</span>
                  {buyer.country}
                  {buyer.city && `, ${buyer.city}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setStatusDialogOpen(true)}>
              Change Status
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Pipeline progress */}
        <div className="flex items-center gap-2">
          {PIPELINE_STAGES.filter((s) => s !== "Lost").map((stage, idx) => {
            const isCompleted = [...PIPELINE_STAGES].indexOf(buyer.buyerStatus) >= idx;
            const isCurrent = stage === buyer.buyerStatus;
            return (
              <div key={stage} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-1.5",
                    isCompleted
                      ? "text-black"
                      : "text-[#333]"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold",
                      isCompleted
                        ? isCurrent
                          ? "bg-brand-forest text-white ring-2 ring-brand-forest"
                          : "bg-brand-forest/10 text-black"
                        : "bg-brand-muted/40 text-[#333] border border-black"
                    )}
                  >
                    {isCompleted ? (
                      stage === "Won" ? (
                        <Award className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )
                    ) : (
                      <span className="text-[10px]">{idx + 1}</span>
                    )}
                  </div>
                  <span className="text-xs hidden sm:inline">{stage}</span>
                </div>
                {idx < PIPELINE_STAGES.filter((s) => s !== "Lost").length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-0.5 mx-1",
                      isCompleted ? "bg-brand-forest" : "bg-brand-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm">
            <div className="text-xs text-[#333] uppercase tracking-wider mb-1">Contact Info</div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-black">
              <Mail className="w-4 h-4" />
              {buyer.email || "—"}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-black mt-1">
              <Phone className="w-4 h-4" />
              {buyer.whatsapp || "—"}
            </div>
          </div>
          <div className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm">
            <div className="text-xs text-[#333] uppercase tracking-wider mb-1">Lead Source</div>
            <div className="text-sm font-medium text-black">
              {buyer.leadSource || "—"}
            </div>
          </div>
          <div className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm">
            <div className="text-xs text-[#333] uppercase tracking-wider mb-1">Est. Order Volume</div>
            <div className="text-sm font-medium text-black">
              {buyer.estimatedOrderVolume || "—"}
            </div>
          </div>
          <div className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm">
            <div className="text-xs text-[#333] uppercase tracking-wider mb-1">Last Contact</div>
            <div className="text-sm font-medium text-black">
              {buyer.lastContact ? formatDate(buyer.lastContact) : "—"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-brand-muted/40 border border-black w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="interactions">
              Interactions
              {buyerInteractions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {buyerInteractions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="followups">
              Follow-ups
              {buyerFollowUps.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {buyerFollowUps.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Company profile */}
            <div className="border border-black rounded-[4px] bg-[#fffdf5] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-black bg-brand-muted/40">
                <h2 className="text-sm font-semibold text-black flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company Profile
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] text-[#333] mb-1">Company Name</div>
                    <div className="font-medium text-brand-foreground">{buyer.companyName}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#333] mb-1">Country</div>
                    <div className="flex items-center gap-1.5 font-medium text-brand-foreground">
                      <Globe className="w-4 h-4 text-[#333]" />
                      {buyer.country}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#333] mb-1">City</div>
                    <div className="font-medium text-brand-foreground">
                      {buyer.city || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#333] mb-1">Website</div>
                    <div className="flex items-center gap-1">
                      {buyer.website ? (
                        <a
                          href={buyer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:underline text-sm flex items-center gap-1"
                        >
                          {buyer.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[#333]">—</span>
                      )}
                    </div>
                  </div>
                </div>
                <Separator className="border-black" />
                <div>
                  <div className="text-[11px] text-[#333] mb-1">Estimated Order Volume</div>
                  <div className="font-medium text-brand-foreground">
                    {buyer.estimatedOrderVolume || "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#333] mb-1">Last Contact</div>
                  <div className="flex items-center gap-1.5 text-sm text-brand-foreground">
                    <Calendar className="w-4 h-4 text-[#333]" />
                    {buyer.lastContact ? formatDate(buyer.lastContact) : "Never"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#333] mb-1">Lead Source</div>
                  <div className="font-medium text-brand-foreground">
                    {buyer.leadSource || "Not specified"}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="border border-black rounded-[4px] bg-[#fffdf5] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-black bg-brand-muted/40">
                <h2 className="text-sm font-semibold text-black flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Information
                </h2>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-[#333] mb-1">Contact Person</div>
                  <div className="font-medium text-brand-foreground">
                    {buyer.contactPerson || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#333] mb-1">WhatsApp</div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Phone className="w-4 h-4 text-[#333]" />
                    <a
                      href={`https://wa.me/${buyer.whatsapp?.replace(/[^0-9+]/g, "")?.replace(/^\+62/, "62") || ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black hover:underline"
                    >
                      {buyer.whatsapp || "—"}
                    </a>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#333] mb-1">Email</div>
                  <a
                    href={`mailto:${buyer.email || ""}`}
                    className="text-black hover:underline text-sm flex items-center gap-1.5"
                  >
                    <Mail className="w-4 h-4 text-[#333]" />
                    {buyer.email || "—"}
                  </a>
                </div>
                <div />
              </div>
            </div>

            {/* Interested products */}
            {(buyer.interestedProducts?.length ?? 0) > 0 && (
              <div className="border border-black rounded-[4px] bg-[#fffdf5] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-black bg-brand-muted/40">
                  <h2 className="text-sm font-semibold text-black flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Interested Products
                  </h2>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {(buyer.interestedProducts ?? []).map((product) => (
                      <Badge
                        key={product}
                        variant="secondary"
                        className="text-xs px-3 py-1"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Related suppliers */}
            {relatedSuppliers.length > 0 && (
              <div className="border border-black rounded-[4px] bg-[#fffdf5] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-black bg-brand-muted/40">
                  <h2 className="text-sm font-semibold text-black flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Associated Suppliers
                  </h2>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {relatedSuppliers.map((sup) => (
                      <Link
                        key={sup.id}
                        href={`/suppliers/${sup.id}`}
                        className="flex items-center justify-between p-2.5 rounded-[4px] border border-transparent hover:border-black hover:bg-brand-muted/30 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-medium">{sup.companyName}</div>
                          <div className="text-xs text-[#333]">
                            {sup.supplierType} · {sup.country}
                          </div>
                        </div>
                        <Badge variant="secondary" className={cn("text-[11px]", statusBadgeClass(sup.verificationStatus))}>
                          {sup.verificationStatus}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={openInteractionDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Interaction
              </Button>
              <Button onClick={openFollowUpDialog}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Follow-up
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-black">Communication History</h3>
              <Button size="sm" onClick={openInteractionDialog}>
                <Plus className="w-4 h-4 mr-1" />
                Add Interaction
              </Button>
            </div>

            {buyerInteractions.length === 0 ? (
              EmptyInteractions()
            ) : (
              <div className="space-y-3">
                {buyerInteractions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-[4px] bg-brand-muted/40 flex items-center justify-center shrink-0">
                        {interactionTypeIcon(interaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[11px]">
                              {interaction.type}
                            </Badge>
                            <span className="text-xs text-[#333]">
                              {formatDate(interaction.createdAt, "dd MMM yyyy HH:mm")}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() => {
                              setInteractionDialogOpen(true);
                              setInteractionForm({
                                ...interactionForm,
                                note: interaction.note,
                                type: interaction.type,
                                createdAt: interaction.createdAt,
                              });
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-brand-foreground mt-2">
                          {interaction.note}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add interaction dialog */}
            <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
              <DialogContent className="w-full max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-black">
                    Add Interaction
                  </DialogTitle>
                  <DialogDescription>
                    Record a communication with {buyer.companyName}.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddInteraction} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Select
                        value={interactionForm.type}
                        onValueChange={(v) =>
                          setInteractionForm({ ...interactionForm, type: v as InteractionType })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INTERACTION_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={interactionForm.createdAt.slice(0, 16)}
                        onChange={(e) =>
                          setInteractionForm({
                            ...interactionForm,
                            createdAt: new Date(e.target.value).toISOString(),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Note</Label>
                    <Textarea
                      value={interactionForm.note}
                      onChange={(e) =>
                        setInteractionForm({ ...interactionForm, note: e.target.value })
                      }
                      placeholder="Record the interaction details..."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setInteractionDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Interaction
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="followups" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-black">Scheduled Follow-ups</h3>
              <Button size="sm" onClick={openFollowUpDialog}>
                <Plus className="w-4 h-4 mr-1" />
                Schedule Follow-up
              </Button>
            </div>

            {buyerFollowUps.length === 0 ? (
              EmptyFollowUps()
            ) : (
              <div className="space-y-2">
                {buyerFollowUps.map((followUp) => {
                  const isOverdue =
                    !followUp.completedAt &&
                    new Date(followUp.scheduledAt).getTime() < renderTime;
                  const isUpcoming =
                    !followUp.completedAt &&
                    new Date(followUp.scheduledAt).getTime() > renderTime &&
                    new Date(followUp.scheduledAt).getTime() <
                      renderTime + 7 * 24 * 60 * 60 * 1000;

                  return (
                    <div
                      key={followUp.id}
                      className={cn(
                        "p-4 rounded-[4px] border shadow-sm",
                        followUp.completedAt
                          ? "border-black bg-brand-muted/30 opacity-60"
                          : isOverdue
                            ? "border-red-200 bg-red-50"
                            : isUpcoming
                              ? "border-amber-200 bg-amber-50"
                              : "border-black bg-[#fffdf5]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            followUp.completedAt
                              ? "bg-emerald-500"
                              : isOverdue
                                ? "bg-red-500"
                                : "bg-amber-500"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-foreground">
                            {followUp.note || "Follow-up"}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[#333]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(followUp.scheduledAt, "dd MMM yyyy HH:mm")}
                            </span>
                            {followUp.completedAt && (
                              <span className="flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed
                              </span>
                            )}
                            {isOverdue && (
                              <span className="text-red-700 font-medium">Overdue</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!followUp.completedAt && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                onClick={() => handleCompleteFollowUp(followUp.id)}
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-red-600"
                                onClick={() => handleDeleteFollowUp(followUp.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Schedule follow-up dialog */}
            <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
              <DialogContent className="w-full max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-black">
                    Schedule Follow-up
                  </DialogTitle>
                  <DialogDescription>
                    Set a reminder for next contact with {buyer.companyName}.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddFollowUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Note</Label>
                    <Textarea
                      value={followUpForm.note}
                      onChange={(e) =>
                        setFollowUpForm({ ...followUpForm, note: e.target.value })
                      }
                      placeholder="What to discuss or follow up on..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Scheduled Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={followUpForm.scheduledAt.slice(0, 16)}
                      onChange={(e) =>
                        setFollowUpForm({
                          ...followUpForm,
                          scheduledAt: new Date(e.target.value).toISOString(),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setFollowUpDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? <Spinner className="w-4 h-4" /> : <Calendar className="w-4 h-4 mr-2" />}
                      Schedule
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="deals" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-black">Associated Deals</h3>
              <Badge variant="secondary" className="text-[11px]">
                {buyerDeals.length} deals
              </Badge>
            </div>

            {buyerDeals.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-brand-muted/40 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-[#333]" />
                </div>
                <p className="text-sm text-[#333]">No deals associated with this buyer.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {buyerDeals.map((deal) => {
                  const dealCommission = commissions.find((c) => c.dealName === deal.name);
                  return (
                    <div
                      key={deal.id}
                      className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-black">{deal.name}</h4>
                            <Badge
                              variant="secondary"
                              className={cn("text-[11px]", statusBadgeClass(deal.dealStatus))}
                            >
                              {deal.dealStatus}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[#333]">
                            <span>
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
                            </span>
                            <span>·</span>
                            <span>Expected: {formatDate(deal.expectedClose)}</span>
                          </div>
                        </div>
                        {dealCommission && (
                          <div className="text-right">
                            <div className="text-xs text-[#333]">Commission</div>
                            <div className="text-sm font-medium text-black">
                              {dealCommission.currency === "IDR"
                                ? new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    maximumFractionDigits: 0,
                                  }).format(dealCommission.commissionAmount)
                                : new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                    maximumFractionDigits: 2,
                                  }).format(dealCommission.commissionAmount)}
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn("text-[10px]", statusBadgeClass(dealCommission.commissionStatus))}
                            >
                              {dealCommission.commissionStatus}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Status change dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent className="w-full max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-black">
                Change Buyer Status
              </DialogTitle>
              <DialogDescription>
                Update the pipeline status for {buyer.companyName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-2">
                {PIPELINE_STAGES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setNewStatus(status)}
                    className={cn(
                      "p-3 rounded-[4px] border text-left transition-colors",
                      newStatus === status
                        ? "border-brand-forest bg-brand-forest/5 text-black"
                        : "border-black bg-[#fffdf5] hover:border-black/60"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          status === buyer.buyerStatus
                            ? "bg-brand-forest"
                            : status === "Won"
                              ? "bg-emerald-500"
                              : status === "Lost"
                                ? "bg-red-500"
                                : "bg-sky-500"
                        )}
                      />
                      <span className="text-sm font-medium">{status}</span>
                    </div>
                    {status === buyer.buyerStatus && (
                      <div className="mt-1 text-[10px] text-[#333]">
                        Current status
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setStatusDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusChange}
                  disabled={!newStatus || loading}
                >
                  {loading ? <Spinner className="w-4 h-4" /> : <Award className="w-4 h-4 mr-2" />}
                  Update Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="w-full max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-red-700">
                Delete buyer?
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium">{buyer.companyName}</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? <Spinner className="w-4 h-4" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 w-[380px]">
            <div className="flex items-center gap-2 p-3 rounded-[4px] shadow-sm">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
                )}
              />
              <span className="text-sm">{toast.message}</span>
              <button
                className="ml-auto text-[#333] hover:text-brand-foreground"
                onClick={() => setToast(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
