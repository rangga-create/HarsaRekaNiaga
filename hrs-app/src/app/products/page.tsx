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
  Package,
  Tag,
  ArrowUpDown,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Building2,
  Globe,
  Truck,
  Scale,
  Minus,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn, formatDate, statusBadgeClass, statusDotClass, shortId } from "@/lib/utils";
import { useProducts, useSuppliers, useActivityLogs } from "@/lib/firebase-store";
import type { Product, ProductCategory, AvailabilityStatus } from "@/lib/data";
import { v4 as uuid } from "uuid";

const CATEGORIES: ProductCategory[] = [
  "Agricultural Products",
  "Charcoal and Briquettes",
  "Food Ingredients",
  "Industrial Materials",
  "Other Commodities",
];

const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  "Available",
  "Limited",
  "Discontinued",
  "Pre-Order",
];

const INITIAL_FORM: Omit<Product, "id" | "demo"> = {
  productName: "",
  productCategory: "Charcoal and Briquettes",
  productDescription: "",
  productImages: [],
  associatedSupplierId: "",
  originCountry: "Indonesia",
  moq: "",
  indicativePrice: 0,
  currency: "IDR",
  packaging: "",
  availabilityStatus: "Available",
  specifications: {},
  internalNotes: "",
};

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-black rounded-[4px] bg-brand-muted/20">
      <div className="w-12 h-12 rounded-full bg-brand-forest/10 flex items-center justify-center mb-4">
        <Package className="w-6 h-6 text-black" />
      </div>
      <h3 className="text-base font-semibold text-black mb-1">No products yet</h3>
      <p className="text-sm text-[#333] max-w-xs">
        Add your first product to start building the catalog.
      </p>
      <Button className="mt-4" onClick={onAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Add Product
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-black rounded-[4px]">
          <Skeleton className="w-10 h-10 rounded-[4px]" />
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

export default function ProductsPage() {
  const router = useRouter();
  const { list: products, add, update, remove, refresh } = useProducts();
  const { list: suppliers } = useSuppliers();
  const { add: addActivityLog } = useActivityLogs();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "">("");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityStatus | "">("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [view, setView] = useState<"table" | "grid">("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...products];
    if (q) {
      rows = rows.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.productCategory.toLowerCase().includes(q) ||
          p.originCountry.toLowerCase().includes(q) ||
          p.productDescription.toLowerCase().includes(q) ||
          p.packaging.toLowerCase().includes(q) ||
          p.internalNotes.toLowerCase().includes(q) ||
          suppliers.some((s) => s.id === p.associatedSupplierId && s.companyName.toLowerCase().includes(q))
      );
    }
    if (categoryFilter) rows = rows.filter((p) => p.productCategory === categoryFilter);
    if (availabilityFilter) rows = rows.filter((p) => p.availabilityStatus === availabilityFilter);
    if (supplierFilter) rows = rows.filter((p) => p.associatedSupplierId === supplierFilter);
    return rows;
  }, [products, search, categoryFilter, availabilityFilter, supplierFilter]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const handleOpen = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setForm({
        productName: product.productName,
        productCategory: product.productCategory,
        productDescription: product.productDescription,
        productImages: [...product.productImages],
        associatedSupplierId: product.associatedSupplierId,
        originCountry: product.originCountry,
        moq: product.moq,
        indicativePrice: product.indicativePrice,
        currency: product.currency,
        packaging: product.packaging,
        availabilityStatus: product.availabilityStatus,
        specifications: { ...product.specifications },
        internalNotes: product.internalNotes,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const addActivityLogForProduct = (action: "Product created" | "Product updated", name: string) => {
    addActivityLog({
      id: uuid(),
      action,
      entity: "Product",
      entityId: editingId ?? uuid(),
      description: `${action} — ${name}`,
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
        addActivityLogForProduct("Product updated", form.productName);
        setToast({ message: "Product updated successfully", type: "success" });
      } else {
        add({
          ...payload,
          id: uuid(),
          demo: true,
        });
        addActivityLogForProduct("Product created", form.productName);
        setToast({ message: "Product added successfully", type: "success" });
      }
      setDialogOpen(false);
      resetForm();
      refresh();
    } catch {
      setToast({ message: "Failed to save product", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setLoading(true);
    remove(deleteTarget.id);
    addActivityLogForProduct("Product updated", deleteTarget.productName);
    setToast({ message: "Product deleted", type: "success" });
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
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-black tracking-tight">Product Catalog</h1>
              <p className="text-sm text-[#333] mt-1">
                Manage products offered through the Harsa Reka Niaga supplier network.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">            <div className="flex items-center border border-black rounded-[4px] p-0.5">
              <Button variant="ghost" size="icon" className={cn(view === "table" ? "bg-brand-muted" : "")} onClick={() => setView("table")}>
                <List className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className={cn(view === "grid" ? "bg-brand-muted" : "")} onClick={() => setView("grid")}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={() => handleOpen()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]" />
            <Input
              className="pl-9"
              placeholder="Search products..."
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

          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ProductCategory | "")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as AvailabilityStatus | "")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {AVAILABILITY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={supplierFilter} onValueChange={(v) => setSupplierFilter(v || "")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All suppliers</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(categoryFilter || availabilityFilter || supplierFilter || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setAvailabilityFilter("");
                setSupplierFilter("");
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Table */}
        {view === "table" ? (
          <div className="border border-black rounded-[4px] overflow-hidden bg-[#fffdf5] shadow-sm">
            {loading ? (
              <LoadingState />
            ) : filtered.length === 0 ? (
              <EmptyState onAdd={() => handleOpen()} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-brand-muted/40">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333] w-[60px]">
                      ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                      Product
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                      Supplier
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                      Price
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                      MOQ
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333]">
                      Availability
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#333] w-[70px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => {
                    const supplier = suppliers.find((s) => s.id === product.associatedSupplierId);
                    return (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer border-b border-black last:border-0 hover:bg-brand-muted/30 transition-colors"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        <TableCell>
                          <span className="text-xs font-mono text-[#333]">{shortId(product.id)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-[4px] bg-brand-forest/10 flex items-center justify-center">
                              <Package className="w-4 h-4 text-black" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{product.productName}</div>
                              <div className="text-xs text-[#333] truncate max-w-[200px]">
                                {product.productDescription}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[11px]">
                            {product.productCategory}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#333]" />
                            <span className="text-sm truncate max-w-[140px]">{supplier?.companyName || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {product.currency === "IDR"
                            ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(product.indicativePrice)
                            : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(product.indicativePrice)}
                        </TableCell>
                        <TableCell className="text-sm text-[#333]">{product.moq || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("text-[11px]", statusBadgeClass(product.availabilityStatus))}
                          >
                            {product.availabilityStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="w-8 h-8" />
                              }
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/products/${product.id}`)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpen(product)}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setDeleteTarget(product);
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
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => {
              const supplier = suppliers.find((s) => s.id === product.associatedSupplierId);
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm hover:border-black/60 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-[4px] bg-brand-forest/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-black" />
                      </div>
                      <div>
                        <div className="text-sm font-medium line-clamp-2">{product.productName}</div>
                        <div className="text-xs text-[#333] mt-0.5">
                          {product.productCategory}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("text-[11px]", statusBadgeClass(product.availabilityStatus))}
                    >
                      {product.availabilityStatus}
                    </Badge>
                  </div>                    <div className="flex items-center gap-1.5 text-sm text-[#333] mb-3">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate">{supplier?.companyName || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-black">
                    <div className="text-xs text-[#333]">
                      MOQ: {product.moq || "—"}
                    </div>
                    <div className="text-sm font-semibold text-black">
                      {product.currency === "IDR"
                        ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(product.indicativePrice)
                        : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(product.indicativePrice)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Results count */}
        <div className="text-xs text-[#333] flex items-center gap-1">
          Showing {filtered.length} of {products.length} products
        </div>

        {/* Add / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-full max-w-[640px] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-2 border-b border-black">
              <DialogTitle className="text-lg font-semibold text-black flex items-center gap-2">
                <Package className="w-5 h-5" />
                {editingId ? "Edit Product" : "Add Product"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the product details below."
                  : "Fill in the product information. Fill in the information below."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    placeholder="Coconut Shell Charcoal Briquettes (35mm)"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="productCategory">Category</Label>
                  <Select
                    value={form.productCategory}
                    onValueChange={(v) => setForm({ ...form, productCategory: v as ProductCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="availabilityStatus">Availability</Label>
                  <Select
                    value={form.availabilityStatus}
                    onValueChange={(v) => setForm({ ...form, availabilityStatus: v as AvailabilityStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="originCountry">Origin Country</Label>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#333]" />
                    <Input
                      id="originCountry"
                      value={form.originCountry}
                      onChange={(e) => setForm({ ...form, originCountry: e.target.value })}
                      placeholder="Indonesia"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="associatedSupplierId">Associated Supplier</Label>                      <Select
                        value={form.associatedSupplierId}
                        onValueChange={(v) => setForm({ ...form, associatedSupplierId: v || "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="indicativePrice">Indicative Price *</Label>
                  <div className="relative">
                    <Input
                      id="indicativePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.indicativePrice || ""}
                      onChange={(e) => setForm({ ...form, indicativePrice: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="pr-20"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Select
                        value={form.currency}
                        onValueChange={(v) => setForm({ ...form, currency: v as "IDR" | "USD" })}
                      >
                        <SelectTrigger className="w-[70px] h-[34px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDR">IDR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#333] mt-1">
                    Indicative price only — not a confirmed quotation.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="packaging">Packaging</Label>
                  <Input
                    id="packaging"
                    value={form.packaging}
                    onChange={(e) => setForm({ ...form, packaging: e.target.value })}
                    placeholder="25 kg vacuum-packed bags"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="productDescription">Description</Label>
                <Textarea
                  id="productDescription"
                  value={form.productDescription}
                  onChange={(e) => setForm({ ...form, productDescription: e.target.value })}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Textarea
                  id="internalNotes"
                  value={form.internalNotes}
                  onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
                  placeholder="Internal notes, sourcing info..."
                  rows={3}
                />
              </div>



              <div className="flex justify-end gap-2 pt-2 border-t border-black">
                <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingId ? "Update Product" : "Add Product"}
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
                Delete product?
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium">{deleteTarget?.productName}</span>?
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
