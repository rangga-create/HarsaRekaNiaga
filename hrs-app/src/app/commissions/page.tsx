"use client";

import { useMemo, useState } from "react";
import { Plus, Percent } from "lucide-react";
import { v4 as uuid } from "uuid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useBuyers,
  useCommissions,
  useCommissionDistribution,
  useProducts,
  useSuppliers,
} from "@/lib/firebase-store";
import type {
  Commission,
  CommissionStatus,
  CommissionType,
} from "@/lib/data";
import { cn, commissionStatusLabel, commissionTypeLabel, formatDate, statusBadgeClass } from "@/lib/utils";

const COMMISSION_TYPES: CommissionType[] = [
  "Percentage of Transaction Value",
  "Fixed Fee",
  "Fee per Ton",
];
const COMMISSION_STATUSES: CommissionStatus[] = [
  "Potential",
  "Agreed",
  "Earned",
  "Payable",
  "Paid",
  "Cancelled",
];

type CommissionDraft = Omit<Commission, "id" | "demo">;
type Currency = Commission["currency"];

function today(): string {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function emptyDraft(): CommissionDraft {
  return {
    dealName: "",
    buyerId: "",
    supplierId: "",
    productId: null,
    transactionValue: 0,
    commissionType: "Percentage of Transaction Value",
    commissionRate: 0,
    commissionAmount: 0,
    payer: "",
    expectedPaymentDate: "",
    actualPaymentDate: null,
    commissionStatus: "Potential",
    internalNotes: "",
    currency: "IDR",
  };
}

function commissionAmount(draft: CommissionDraft): number {
  if (draft.commissionType === "Percentage of Transaction Value") {
    return (draft.transactionValue * draft.commissionRate) / 100;
  }
  if (draft.commissionType === "Fixed Fee") return draft.commissionRate;
  return draft.commissionAmount;
}

function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(amount);
}

function formatTotals(commissions: Commission[]): string[] {
  const totals = commissions.reduce<Record<Currency, number>>(
    (result, commission) => {
      result[commission.currency] += commission.commissionAmount;
      return result;
    },
    { IDR: 0, USD: 0 }
  );
  return (["IDR", "USD"] as const)
    .filter((currency) => totals[currency] > 0)
    .map((currency) => formatMoney(totals[currency], currency));
}

export default function CommissionsPage() {
  const { list: commissions, add, update, refresh } = useCommissions();
  const { list: buyers } = useBuyers();
  const { list: suppliers } = useSuppliers();
  const { list: products } = useProducts();
  const [statusFilter, setStatusFilter] = useState("all");
  const [buyerFilter, setBuyerFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CommissionDraft>(emptyDraft);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(
    null
  );

  const filtered = useMemo(
    () =>
      commissions.filter((commission) => {
        const date = commission.expectedPaymentDate;
        return (
          (statusFilter === "all" ||
            commission.commissionStatus === statusFilter) &&
          (buyerFilter === "all" || commission.buyerId === buyerFilter) &&
          (supplierFilter === "all" ||
            commission.supplierId === supplierFilter) &&
          (!dateFrom || date >= dateFrom) &&
          (!dateTo || date <= dateTo)
        );
      }),
    [commissions, statusFilter, buyerFilter, supplierFilter, dateFrom, dateTo]
  );

  const showToast = (message: string, error = false) => {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 2500);
  };

  const openNew = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft(), expectedPaymentDate: today() });
    setDialogOpen(true);
  };

  const openEdit = (commission: Commission) => {
    setEditingId(commission.id);
    setDraft({
      dealName: commission.dealName,
      buyerId: commission.buyerId,
      supplierId: commission.supplierId,
      productId: commission.productId,
      transactionValue: commission.transactionValue,
      commissionType: commission.commissionType,
      commissionRate: commission.commissionRate,
      commissionAmount: commission.commissionAmount,
      payer: commission.payer,
      expectedPaymentDate: commission.expectedPaymentDate,
      actualPaymentDate: commission.actualPaymentDate,
      commissionStatus: commission.commissionStatus,
      internalNotes: commission.internalNotes,
      currency: commission.currency,
    });
    setDialogOpen(true);
  };

  const changeStatus = (commission: Commission, status: CommissionStatus) => {
    update(commission.id, {
      commissionStatus: status,
      actualPaymentDate:
        status === "Paid"
          ? commission.actualPaymentDate || today()
          : null,
    });
    refresh();
    showToast(`Status pembayaran diperbarui menjadi ${commissionStatusLabel(status)}`);
  };

  const saveCommission = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.dealName.trim() || !draft.buyerId || !draft.supplierId) {
      showToast("Tambahkan nama deal, pembeli, dan pemasok.", true);
      return;
    }

    const amount = commissionAmount(draft);
    if (!Number.isFinite(amount) || amount < 0) {
      showToast("Masukkan jumlah komisi yang valid.", true);
      return;
    }

    const values: CommissionDraft = {
      ...draft,
      dealName: draft.dealName.trim(),
      commissionRate: Number(draft.commissionRate),
      commissionAmount: amount,
      transactionValue: Number(draft.transactionValue),
      actualPaymentDate:
        draft.commissionStatus === "Paid"
          ? draft.actualPaymentDate || today()
          : null,
    };

    if (editingId) {
      update(editingId, values);
      showToast("Komisi berhasil diperbarui");
    } else {
      add({ ...values, id: uuid(), demo: true });
      showToast("Komisi berhasil ditambahkan");
    }
    refresh();
    setDialogOpen(false);
  };

  const setDraftField = <K extends keyof CommissionDraft>(
    field: K,
    value: CommissionDraft[K]
  ) => setDraft((current) => ({ ...current, [field]: value }));

  const summary = [
    { label: "Total Potensial", status: "Potential" as const },
    { label: "Disepakati", status: "Agreed" as const },
    { label: "Tertanggung", status: "Payable" as const },
    { label: "Lunas", status: "Paid" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-brand-forest text-white">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">
              Pelacak Komisi
            </h1>
            <p className="mt-1 text-sm text-[#333]">
              Lacak perjanjian komisi dan status pembayaran.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Komisi
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(({ label, status }) => {
          const amounts = formatTotals(
            commissions.filter((commission) => commission.commissionStatus === status)
          );
          return (
            <Card key={status} className="border-black">
              <CardContent className="space-y-2">
                <p className="text-sm text-[#333]">{label}</p>
                {amounts.length ? (
                  amounts.map((amount) => (
                    <p key={amount} className="text-lg font-semibold text-black">
                      {amount}
                    </p>
                  ))
                ) : (
                  <p className="text-lg font-semibold text-black">—</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-black">
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              {COMMISSION_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>{commissionStatusLabel(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={buyerFilter} onValueChange={(value) => setBuyerFilter(value ?? "all")}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Pembeli" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua pembeli</SelectItem>
              {buyers.map((buyer) => (
                <SelectItem key={buyer.id} value={buyer.id}>{buyer.companyName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={supplierFilter} onValueChange={(value) => setSupplierFilter(value ?? "all")}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Pemasok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua pemasok</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>{supplier.companyName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Label htmlFor="date-from" className="text-xs text-[#333]">Dari</Label>
            <Input id="date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-[150px]" />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="date-to" className="text-xs text-[#333]">Sampai</Label>
            <Input id="date-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-[150px]" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Pembeli / Pemasok</TableHead>
                <TableHead>Komisi</TableHead>
                <TableHead>Tanggal Pengajuan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Status Pembayaran</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-[#333]">
                    Tidak ada komisi yang cocok dengan filter ini.
                  </TableCell>
                </TableRow>
              ) : filtered.map((commission) => {
                const buyer = buyers.find((item) => item.id === commission.buyerId);
                const supplier = suppliers.find((item) => item.id === commission.supplierId);
                return (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div className="font-medium text-brand-foreground">{commission.dealName}</div>
                      <div className="text-xs text-[#333]">
                        {commission.payer} · {commissionTypeLabel(commission.commissionType)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{buyer?.companyName ?? "—"}</div>
                      <div className="text-xs text-[#333]">{supplier?.companyName ?? "—"}</div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatMoney(commission.commissionAmount, commission.currency)}
                    </TableCell>
                    <TableCell>{formatDate(commission.expectedPaymentDate)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("text-[11px]", statusBadgeClass(commission.commissionStatus))}>
                        {commissionStatusLabel(commission.commissionStatus)}
                      </Badge>
                      {commission.actualPaymentDate && (
                        <div className="mt-1 text-xs text-[#333]">
                          Lunas {formatDate(commission.actualPaymentDate)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={commission.commissionStatus}
                        onValueChange={(value) => value && changeStatus(commission, value as CommissionStatus)}
                      >
                        <SelectTrigger className="w-[135px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMISSION_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>{commissionStatusLabel(status)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(commission)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="pt-3 text-xs text-[#333]">
            Menampilkan {filtered.length} dari {commissions.length} komisi
          </p>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-semibold text-black">Bagi Hasil Mitra</h2>
            <p className="mt-1 text-sm text-[#333]">
              Distribusi saat ini untuk pendapatan komisi.
            </p>
          </div>
          <RevenueDistribution />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit komisi" : "Tambah komisi"}</DialogTitle>
            <DialogDescription>
              Catat perjanjian komisi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveCommission} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="deal-name">Nama deal</Label>
                <Input id="deal-name" required value={draft.dealName} onChange={(event) => setDraftField("dealName", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pembeli</Label>
                <Select value={draft.buyerId} onValueChange={(value) => setDraftField("buyerId", value ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Pilih pembeli" /></SelectTrigger>
                  <SelectContent>
                    {buyers.map((buyer) => <SelectItem key={buyer.id} value={buyer.id}>{buyer.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pemasok</Label>
                <Select value={draft.supplierId} onValueChange={(value) => setDraftField("supplierId", value ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Pilih pemasok" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Produk (opsional)</Label>
                <Select value={draft.productId ?? "none"} onValueChange={(value) => setDraftField("productId", !value || value === "none" ? null : value)}>
                  <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada produk</SelectItem>
                    {products.map((product) => <SelectItem key={product.id} value={product.id}>{product.productName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pembayar</Label>
                <Input value={draft.payer} onChange={(event) => setDraftField("payer", event.target.value)} placeholder="Pembeli atau pemasok" />
              </div>
              <div className="space-y-2">
                <Label>Nilai transaksi</Label>
                <Input type="number" min="0" step="any" value={draft.transactionValue} onChange={(event) => setDraftField("transactionValue", Number(event.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Mata uang</Label>
                <Select value={draft.currency} onValueChange={(value) => value && setDraftField("currency", value as Currency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipe komisi</Label>
                <Select value={draft.commissionType} onValueChange={(value) => value && setDraftField("commissionType", value as CommissionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMMISSION_TYPES.map((type) => <SelectItem key={type} value={type}>{commissionTypeLabel(type)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{draft.commissionType === "Percentage of Transaction Value" ? "Tarif komisi (%)" : draft.commissionType === "Fee per Ton" ? "Biaya per ton" : "Biaya tetap"}</Label>
                <Input type="number" min="0" step="any" value={draft.commissionRate} onChange={(event) => setDraftField("commissionRate", Number(event.target.value))} />
              </div>
              {draft.commissionType === "Fee per Ton" && (
                <div className="space-y-2">
                  <Label>Jumlah komisi total</Label>
                  <Input type="number" min="0" step="any" value={draft.commissionAmount} onChange={(event) => setDraftField("commissionAmount", Number(event.target.value))} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Tanggal pembayaran rencana</Label>
                <Input type="date" required value={draft.expectedPaymentDate} onChange={(event) => setDraftField("expectedPaymentDate", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={draft.commissionStatus}
                  onValueChange={(value) => {
                    if (!value) return;
                    const status = value as CommissionStatus;
                    setDraft((current) => ({
                      ...current,
                      commissionStatus: status,
                      actualPaymentDate:
                        status === "Paid"
                          ? current.actualPaymentDate || today()
                          : null,
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMMISSION_STATUSES.map((status) => <SelectItem key={status} value={status}>{commissionStatusLabel(status)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {draft.commissionStatus === "Paid" && (
                <div className="space-y-2">
                  <Label>Tanggal pembayaran aktual</Label>
                  <Input type="date" required value={draft.actualPaymentDate ?? ""} onChange={(event) => setDraftField("actualPaymentDate", event.target.value || null)} />
                </div>
              )}
              <div className="space-y-2 sm:col-span-2">
                <Label>Catatan internal</Label>
                <Input value={draft.internalNotes} onChange={(event) => setDraftField("internalNotes", event.target.value)} />
              </div>
            </div>
            <p className="text-sm text-[#333]">
              Jumlah komisi: <span className="font-medium text-black">{formatMoney(commissionAmount(draft), draft.currency)}</span>
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit">{editingId ? "Simpan perubahan" : "Tambah komisi"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {toast && (
        <div className={cn(
          "fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-[4px] border px-4 py-3 shadow-lg",
          toast.error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
        )}>
          <span className="text-sm">{toast.message}</span>
          <button type="button" className="text-xs font-medium" onClick={() => setToast(null)}>Tutup</button>
        </div>
      )}
    </div>
  );
}

function RevenueDistribution() {
  const { value: distribution } = useCommissionDistribution();
  const shares = [
    { label: "Mitra A", value: distribution.partnerAShare },
    { label: "Mitra B", value: distribution.partnerBShare },
    { label: "Cadangan operasional", value: distribution.operationalReserve },
  ];
  const total = shares.reduce((sum, share) => sum + share.value, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {shares.map(({ label, value }) => (
        <div key={label} className="rounded-[4px] border border-black bg-brand-muted/20 p-4">
          <p className="text-sm text-[#333]">{label}</p>
          <p className="mt-1 text-xl font-semibold text-black">{value}%</p>
        </div>
      ))}
      <p className={cn("text-sm font-medium sm:col-span-3", total === 100 ? "text-emerald-700" : "text-red-700")}>
        Total: {total}% {total === 100 ? "· distribusi seimbang" : "· distribusi harus total 100%"}
      </p>
    </div>
  );
}
