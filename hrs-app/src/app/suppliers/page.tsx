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
  Building2,
  Mail,
  Phone,
  MapPin,
  Tag,
  FileText,
  Globe,
  ArrowUpDown,
  Package,
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
import { cn, formatDate, statusBadgeClass, statusDotClass, shortId } from "@/lib/utils";
import {
  useSuppliers,
  useProducts,
  useActivityLogs,
} from "@/lib/firebase-store";
import type { Supplier, SupplierType, VerificationStatus, PartnershipStatus } from "@/lib/data";
import { v4 as uuid } from "uuid";

const SUPPLIER_TYPES: SupplierType[] = [
  "Manufacturer",
  "Factory",
  "Distributor",
  "Trading Company",
  "Exporter",
];

const VERIFICATION_STATUSES: VerificationStatus[] = [
  "Unverified",
  "Under Review",
  "Verified",
  "Rejected",
];

const PARTNERSHIP_STATUSES: PartnershipStatus[] = [
  "Prospect",
  "Contacted",
  "Negotiation",
  "Partner",
  "Inactive",
];

const INITIAL_FORM: Omit<Supplier, "id" | "dateAdded" | "demo"> = {
  companyName: "",
  contactPerson: "",
  email: "",
  whatsapp: "",
  country: "",
  city: "",
  supplierType: "Manufacturer",
  productCategories: [],
  moq: "",
  productionCapacity: "",
  verificationStatus: "Unverified",
  partnershipStatus: "Prospect",
  documents: [],
  internalNotes: "",
};

function SupplierIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full border border-black bg-brand-muted/40 text-black font-semibold text-sm",
        className
      )}
    >
      <Building2 className="w-5 h-5" />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-black rounded-[4px] bg-brand-muted/20">
      <div className="w-12 h-12 rounded-full bg-brand-forest/10 flex items-center justify-center mb-4">
        <Building2 className="w-6 h-6 text-black" />
      </div>
      <h3 className="text-base font-semibold text-black mb-1">No suppliers yet</h3>
      <p className="text-sm text-[#333] max-w-xs">
        Add your first supplier to start sourcing products for Harsa Reka Niaga.
      </p>
      <Button className="mt-4" onClick={onAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Add Supplier
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

function SupplierDetailSheet({ supplier }: { supplier: Supplier }) {
  const products = useProducts().list;
  const productMatch = products.filter((p) => p.associatedSupplierId === supplier.id);

  return (
    <Sheet>
      <SheetTrigger className="flex items-center gap-1.5 text-xs text-[#333] hover:text-black transition-colors">
        View details
        <Eye className="w-3.5 h-3.5" />
      </SheetTrigger>
      <SheetContent className="w-[480px] sm:max-w-[540px] p-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <SupplierIcon className="w-10 h-10" />
            <div>
              <div className="font-semibold text-black">{supplier.companyName}</div>
              <div className="text-sm text-[#333]">
                {supplier.supplierType} · {supplier.country}
              </div>
            </div>
          </SheetTitle>
          <SheetDescription>
            <Badge variant="secondary" className={cn("text-[11px]", statusBadgeClass(supplier.verificationStatus))}>
              {supplier.verificationStatus}
            </Badge>
            <span className="text-[#333] mx-2">·</span>
            <Badge variant="secondary" className={cn("text-[11px]", statusBadgeClass(supplier.partnershipStatus))}>
              {supplier.partnershipStatus}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Company info */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#333] mb-3 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              Company Information
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[11px] text-[#333] mb-0.5">Supplier Type</div>
                <div className="font-medium text-brand-foreground">{supplier.supplierType}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#333] mb-0.5">Country</div>
                <div className="flex items-center gap-1.5 font-medium text-brand-foreground">
                  <Globe className="w-4 h-4 text-[#333]" />
                  {supplier.country}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#333] mb-0.5">City</div>
                <div className="font-medium text-brand-foreground">{supplier.city || "—"}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#333] mb-0.5">MOQ</div>
                <div className="font-medium text-brand-foreground">{supplier.moq || "—"}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#333] mb-0.5">Production Capacity</div>
                <div className="font-medium text-brand-foreground">{supplier.productionCapacity || "—"}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#333] mb-0.5">Product Categories</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {supplier.productCategories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-[11px]">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <Separator className="border-black" />

          {/* Contact */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#333] mb-3 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" />
              Contact Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", statusDotClass(supplier.verificationStatus))} />
                <span className="text-[11px] text-[#333]">Contact Person</span>
                <span className="font-medium text-brand-foreground ml-auto truncate">{supplier.contactPerson || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#333] shrink-0" />
                <span className="text-brand-foreground">{supplier.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#333] shrink-0" />
                <span className="text-brand-foreground">{supplier.whatsapp || "—"}</span>
              </div>
            </div>
          </section>

          <Separator className="border-black" />

          {/* Products */}
          {productMatch.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#333] mb-3 flex items-center gap-2">
                <Package className="w-3.5 h-3.5" />
                Product Portfolio
              </h4>
              <div className="space-y-2">
                {productMatch.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="flex items-center justify-between p-2.5 rounded-[4px] border border-transparent hover:border-black hover:bg-brand-muted/30 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium truncate">{p.productName}</div>
                      <div className="text-xs text-[#333] mt-0.5">
                        {p.productCategory} · {p.currency === "IDR" ? "IDR" : "USD"}{" "}
                        {p.currency === "IDR"
                          ? p.indicativePrice.toLocaleString("id-ID")
                          : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(p.indicativePrice)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[11px]">
                      {p.availabilityStatus}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <Separator className="border-black" />

          {/* Internal notes */}
          {supplier.internalNotes && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#333] mb-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Internal Notes
              </h4>
              <p className="text-sm text-brand-foreground bg-brand-muted/40 rounded-[4px] p-3 leading-relaxed">
                {supplier.internalNotes}
              </p>
            </section>
          )}

          {/* Documents */}
          {supplier.documents.length > 0 && (
            <section className="flex-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#333] mb-2">
                Documents
              </h4>
              <ScrollArea className="h-[120px] pr-1">
                <div className="space-y-1.5">
                  {supplier.documents.map((d) => (
                    <div
                      key={d}
                      className="flex items-center gap-2 p-2 rounded-[4px] border border-black bg-brand-muted/30 text-sm"
                    >
                      <FileText className="w-4 h-4 text-black" />
                      <span className="truncate font-medium">{d}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </section>
          )}
        </div>


      </SheetContent>
    </Sheet>
  );
}

function TopproviderPlacement({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

export default function SuppliersPage() {
  const router = useRouter();
  const { list: suppliers, add, update, remove, refresh } = useSuppliers();
  const { add: addActivityLog } = useActivityLogs();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SupplierType | "">("");
  const [verificationFilter, setVerificationFilter] = useState<VerificationStatus | "">("");
  const [partnershipFilter, setPartnershipFilter] = useState<PartnershipStatus | "">("");
  const [sortField, setSortField] = useState<keyof Supplier>("dateAdded");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [categoryInput, setCategoryInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categories = form.productCategories;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...suppliers];
    if (q) {
      rows = rows.filter(
        (s) =>
          s.companyName.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.supplierType.toLowerCase().includes(q) ||
          s.productCategories.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (typeFilter) rows = rows.filter((s) => s.supplierType === typeFilter);
    if (verificationFilter) rows = rows.filter((s) => s.verificationStatus === verificationFilter);
    if (partnershipFilter) rows = rows.filter((s) => s.partnershipStatus === partnershipFilter);
    rows.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
    return rows;
  }, [suppliers, search, typeFilter, verificationFilter, partnershipFilter, sortField, sortDir]);

  const handleSort = (field: keyof Supplier) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setCategoryInput("");
  };

  const handleOpen = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      setForm({
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        whatsapp: supplier.whatsapp,
        country: supplier.country,
        city: supplier.city,
        supplierType: supplier.supplierType,
        productCategories: [...supplier.productCategories],
        moq: supplier.moq,
        productionCapacity: supplier.productionCapacity,
        verificationStatus: supplier.verificationStatus,
        partnershipStatus: supplier.partnershipStatus,
        documents: [...supplier.documents],
        internalNotes: supplier.internalNotes,
      });
      setCategoryInput("");
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCategoryAdd = () => {
    const val = categoryInput.trim();
    if (val && !categories.includes(val)) {
      setForm((f) => ({ ...f, productCategories: [...f.productCategories, val] }));
    }
    setCategoryInput("");
  };

  const handleCategoryRemove = (cat: string) => {
    setForm((f) => ({ ...f, productCategories: f.productCategories.filter((c) => c !== cat) }));
  };

  const logSupplier = (action: "Supplier created" | "Supplier updated", companyName: string, entityId: string) => {
    addActivityLog({
      id: uuid(),
      action,
      entity: "Supplier",
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
        logSupplier("Supplier updated", form.companyName, editingId);
        setToast({ message: "Supplier updated successfully", type: "success" });
      } else {
        const id = uuid();
        add({
          ...payload,
          id,
          dateAdded: new Date().toISOString().split("T")[0],
          demo: true,
        });
        logSupplier("Supplier created", form.companyName, id);
        setToast({ message: "Supplier added successfully", type: "success" });
      }
      setDialogOpen(false);
      resetForm();
      refresh();
    } catch {
      setToast({ message: "Failed to save supplier", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setLoading(true);
    remove(deleteTarget.id);
    logSupplier("Supplier updated", deleteTarget.companyName, deleteTarget.id);
    setToast({ message: "Supplier deleted", type: "success" });
    setDeleteTarget(null);
    setConfirmDelete(false);
    setLoading(false);
    refresh();
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-[4px] bg-brand-forest text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-black tracking-tight">Suppliers</h1>
              <p className="text-sm text-[#333] mt-1">
                Manage factories, manufacturers, and product suppliers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">            <Button onClick={() => handleOpen()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]" />
            <Input
              className="pl-9"
              placeholder="Search suppliers..."
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

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as SupplierType | "")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Supplier Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {SUPPLIER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={verificationFilter} onValueChange={(v) => setVerificationFilter(v as VerificationStatus | "")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {VERIFICATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={partnershipFilter} onValueChange={(v) => setPartnershipFilter(v as PartnershipStatus | "")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Partnership" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {PARTNERSHIP_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(typeFilter || verificationFilter || partnershipFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter("");
                setVerificationFilter("");
                setPartnershipFilter("");
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>

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
                  <TableHead
                    className="text-xs font-semibold uppercase tracking-wider text-[#333] cursor-pointer hover:text-black"
                    onClick={() => handleSort("companyName")}
                  >
                    Company
                    {sortField === "companyName" && (
                      <ArrowUpDown className="w-3.5 h-3.5 inline ml-1" />
                    )}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                    Contact
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                    Type
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                    Country
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                    Added
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333] w-[60px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="cursor-pointer border-b border-black last:border-0 hover:bg-brand-muted/30 transition-colors"
                    onClick={() => router.push(`/suppliers/${supplier.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-brand-forest/10 flex items-center justify-center text-black shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{supplier.companyName}</div>
                          <div className="text-xs text-[#333] truncate">{supplier.contactPerson || "—"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm truncate max-w-[180px]">{supplier.email || "—"}</div>
                      <div className="text-xs text-[#333] truncate max-w-[180px]">{supplier.whatsapp || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[11px] whitespace-nowrap">
                        {supplier.supplierType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-[#333] shrink-0" />
                        <span className="truncate">{supplier.country}{supplier.city ? `, ${supplier.city}` : ""}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 items-start">
                        <Badge variant="secondary" className={cn("text-[11px] whitespace-nowrap", statusBadgeClass(supplier.verificationStatus))}>
                          {supplier.verificationStatus}
                        </Badge>
                        <Badge variant="secondary" className={cn("text-[11px] whitespace-nowrap", statusBadgeClass(supplier.partnershipStatus))}>
                          {supplier.partnershipStatus}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#333]">
                      {formatDate(supplier.dateAdded)}
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
                            onClick={(e) => { e.stopPropagation(); router.push(`/suppliers/${supplier.id}`); }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleOpen(supplier); }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(supplier);
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

        {/* Results count */}
        <div className="text-xs text-[#333] flex items-center gap-1">
          Showing {filtered.length} of {suppliers.length} suppliers
        </div>

        {/* Add / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-full max-w-[640px] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-2 border-b border-black">
              <DialogTitle className="text-lg font-semibold text-black flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {editingId ? "Edit Supplier" : "Add Supplier"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the supplier details below."
                  : "Fill in the supplier information. Fill in the information below."}
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
                    placeholder="PT Example Supplier"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="supplierType">Supplier Type</Label>
                  <Select
                    value={form.supplierType}
                    onValueChange={(v) => setForm({ ...form, supplierType: v as SupplierType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Agus Supriyadi"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="Indonesia"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Surakarta"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="moq">MOQ</Label>
                  <Input
                    id="moq"
                    value={form.moq}
                    onChange={(e) => setForm({ ...form, moq: e.target.value })}
                    placeholder="500 kg"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="productionCapacity">Production Capacity</Label>
                  <Input
                    id="productionCapacity"
                    value={form.productionCapacity}
                    onChange={(e) => setForm({ ...form, productionCapacity: e.target.value })}
                    placeholder="2 tons/day"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="supplier@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="+62 812 0000 1111"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Verification Status</Label>
                  <Select
                    value={form.verificationStatus}
                    onValueChange={(v) => setForm({ ...form, verificationStatus: v as VerificationStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-[#333]">
                    Internal assessment only — not a legal certification.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Partnership Status</Label>
                  <Select
                    value={form.partnershipStatus}
                    onValueChange={(v) => setForm({ ...form, partnershipStatus: v as PartnershipStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTNERSHIP_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Product Categories</Label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="text-xs px-2 py-1 cursor-pointer hover:bg-brand-muted"
                      onClick={() => handleCategoryRemove(c)}
                    >
                      {c}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCategoryAdd();
                      }
                    }}
                    placeholder="Add a category..."
                  />
                  <Button type="button" variant="outline" onClick={handleCategoryAdd}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Textarea
                  id="internalNotes"
                  value={form.internalNotes}
                  onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
                  placeholder="Internal assessment, sourcing notes..."
                  rows={3}
                />
              </div>



              <div className="flex justify-end gap-2 pt-2 border-t border-black">
                <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingId ? "Update Supplier" : "Add Supplier"}
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
                Delete supplier?
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
