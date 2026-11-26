"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, MessageCircle, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useBuyerRequests, useBuyers, useCommissions, useDeals, useRequestFindings, useSuppliers } from "@/lib/firebase-store";
import { deleteMediaFiles, uploadMediaFiles, compressMediaFile, formatBytes, MAX_MEDIA_BYTES } from "@/lib/storage";
import type { BuyerRequest, Commission, CommissionType, Deal, FindingStatus, MediaAttachment, RequestFinding, RequestStatus } from "@/lib/data";
import { parsePrice, daysUntil } from "@/lib/utils";
import { v4 as uuid } from "uuid";

const RSTATUSES: RequestStatus[] = ["Open", "Sourcing", "Found", "Matched", "Closed"];
const FSTATUSES: FindingStatus[] = ["Submitted", "Reviewed", "Matched", "Rejected"];
const COMMISSION_TYPES: CommissionType[] = ["Percentage of Transaction Value", "Fixed Fee", "Fee per Ton"];

type ConvertDraft = {
  dealName: string;
  buyerId: string;
  supplierId: string;
  transactionValue: number;
  currency: "IDR" | "USD";
  commissionType: CommissionType;
  commissionRate: number;
  quantity: number;
  payer: string;
  expectedPaymentDate: string;
  createDeal: boolean;
};

function emptyConvertDraft(): ConvertDraft {
  return {
    dealName: "",
    buyerId: "",
    supplierId: "",
    transactionValue: 0,
    currency: "USD",
    commissionType: "Percentage of Transaction Value",
    commissionRate: 2,
    quantity: 0,
    payer: "",
    expectedPaymentDate: "",
    createDeal: true,
  };
}

function commissionAmountOf(d: ConvertDraft): number {
  if (d.commissionType === "Percentage of Transaction Value") return (d.transactionValue * d.commissionRate) / 100;
  if (d.commissionType === "Fixed Fee") return d.commissionRate;
  return d.commissionRate * (d.quantity || 0);
}

function normalizePhone(raw: string): string {
  let digits = (raw || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return digits;
}

function MediaGrid({ items, onDelete }: { items: MediaAttachment[]; onDelete?: (item: MediaAttachment) => void | Promise<void> }) {
  const [preview, setPreview] = useState<MediaAttachment | null>(null);
  if (!items?.length) return <p className="text-sm text-[#333]">Tidak ada media.</p>;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((m) => (
          <div key={m.id} className="relative group rounded-[4px] overflow-hidden border bg-[#f5f0e1]">
            <button type="button" onClick={() => setPreview(m)} className="block w-full" title={`Preview ${m.name}`}>
              {m.type === "video" ? (
                <video src={m.url} className="w-full h-32 object-cover" muted playsInline preload="metadata" />
              ) : (
                <img src={m.url} alt={m.name} className="w-full h-32 object-cover" loading="lazy" />
              )}
            </button>
            {onDelete && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute top-1 right-1 z-10 h-7 w-7 bg-white/90 border border-black shadow-[2px_2px_0_#111]"
                title="Hapus media"
                onClick={() => void onDelete(m)}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </Button>
            )}
            <div className="p-2 text-[11px] truncate text-[#333]">{m.name}</div>
          </div>
        ))}
      </div>
      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="truncate pr-8">{preview?.name}</DialogTitle></DialogHeader>
          {preview && (
            <>
              <div className="flex items-center justify-center rounded-[4px] bg-black/5 overflow-hidden">
                {preview.type === "video" ? (
                  <video src={preview.url} controls autoPlay className="max-h-[70vh] w-full" />
                ) : (
                  <img src={preview.url} alt={preview.name} className="max-h-[70vh] w-auto object-contain" />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-[#333]">
                <span>{formatBytes(preview.size)}</span>
                <div className="flex items-center gap-3">
                  <a href={preview.url} target="_blank" rel="noreferrer" className="underline">Buka tab baru</a>
                  {onDelete && (
                    <Button type="button" size="sm" variant="outline" onClick={() => { void onDelete(preview); setPreview(null); }}>
                      <Trash2 className="w-3.5 h-3.5 mr-1 text-red-500" />Hapus
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { list: requests, update: updateRequest } = useBuyerRequests();
  const { list: buyers } = useBuyers();
  const { list: suppliers } = useSuppliers();
  const { list: findings, add: addFinding, update: updateFinding, remove: removeFinding } = useRequestFindings();
  const { add: addCommission } = useCommissions();
  const { add: addDeal } = useDeals();
  const request = requests.find((r) => r.id === id);
  const buyer = buyers.find((b) => b.id === request?.buyerId);
  const requestFindings = useMemo(() => {
    return findings
      .filter((f) => f.requestId === id)
      .sort((a, b) => {
        const pa = parsePrice(a.price);
        const pb = parsePrice(b.price);
        if (pa === null && pb === null) return (b.createdAt || "").localeCompare(a.createdAt || "");
        if (pa === null) return 1;
        if (pb === null) return -1;
        if (pa !== pb) return pa - pb;
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
  }, [findings, id]);
  const cheapestFindingId = useMemo(() => {
    let best: { id: string; price: number } | null = null;
    for (const f of requestFindings) {
      const price = parsePrice(f.price);
      if (price === null) continue;
      if (!best || price < best.price) best = { id: f.id, price };
    }
    return best?.id ?? null;
  }, [requestFindings]);
  const requestDeadline = useMemo(() => {
    if (!request?.neededBy || request.status === "Closed") return null;
    const days = daysUntil(request.neededBy);
    if (days === null) return null;
    if (days < 0) return { label: `Lewat ${Math.abs(days)} hari`, cls: "bg-red-50 text-red-800 border-red-200" };
    if (days === 0) return { label: "Hari ini", cls: "bg-amber-50 text-amber-800 border-amber-200" };
    if (days <= 7) return { label: `${days} hari lagi`, cls: "bg-amber-50 text-amber-800 border-amber-200" };
    return null;
  }, [request]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [compressing, setCompressing] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState({ supplierName: "", foundSpecs: "", price: "", availability: "", moq: "", notes: "", status: "Submitted" as FindingStatus });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [convertFinding, setConvertFinding] = useState<RequestFinding | null>(null);
  const [convertDraft, setConvertDraft] = useState<ConvertDraft>(emptyConvertDraft);
  const [convertSaving, setConvertSaving] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const [waMessage, setWaMessage] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const saveFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    setSaving(true); setError("");
    try {
      const media = files.length ? await uploadMediaFiles(files, "findings") : [];
      const now = new Date().toISOString();
      const finding: RequestFinding = { id: uuid(), requestId: request.id, supplierName: form.supplierName.trim(), foundSpecs: form.foundSpecs.trim(), foundMedia: media, price: form.price.trim(), availability: form.availability.trim(), moq: form.moq.trim(), status: form.status, notes: form.notes.trim(), createdBy: user?.email || "admin", createdAt: now, demo: false };
      await addFinding(finding);
      if (request.status === "Open") await updateRequest(request.id, { status: "Sourcing", updatedAt: now } as Partial<BuyerRequest>);
      setOpen(false); setFiles([]); setForm({ supplierName: "", foundSpecs: "", price: "", availability: "", moq: "", notes: "", status: "Submitted" });
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan temuan."); }
    finally { setSaving(false); }
  };

  const setRequestStatus = async (status: RequestStatus) => {
    if (!request) return;
    await updateRequest(request.id, { status, updatedAt: new Date().toISOString() } as Partial<BuyerRequest>);
  };

  const setFindingStatus = async (f: RequestFinding, status: FindingStatus) => {
    await updateFinding(f.id, { status } as Partial<RequestFinding>);
    if (status === "Matched" && request) await updateRequest(request.id, { status: "Matched", updatedAt: new Date().toISOString() } as Partial<BuyerRequest>);
  };

  const onDeleteFinding = async (f: RequestFinding) => {
    if (!confirm("Hapus temuan ini?")) return;
    try { await deleteMediaFiles(f.foundMedia || []); } catch (err) { setError(err instanceof Error ? err.message : "Gagal hapus media."); return; }
    await removeFinding(f.id);
  };

  const onDeleteRequestMedia = async (m: MediaAttachment) => {
    if (!request) return;
    if (!confirm(`Hapus media "${m.name}"?`)) return;
    setError("");
    try {
      await deleteMediaFiles([m]);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Gagal hapus media.", type: "error" });
      return;
    }
    try {
      await updateRequest(request.id, {
        requestMedia: (request.requestMedia || []).filter((x) => x.id !== m.id),
        updatedAt: new Date().toISOString(),
      } as Partial<BuyerRequest>);
      setToast({ message: "Media permintaan dihapus.", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Gagal memperbarui data.", type: "error" });
    }
  };

  const onDeleteFindingMedia = async (f: RequestFinding, m: MediaAttachment) => {
    if (!confirm(`Hapus media "${m.name}"?`)) return;
    setError("");
    try {
      await deleteMediaFiles([m]);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Gagal hapus media.", type: "error" });
      return;
    }
    try {
      await updateFinding(f.id, { foundMedia: (f.foundMedia || []).filter((x) => x.id !== m.id) } as Partial<RequestFinding>);
      setToast({ message: "Media temuan dihapus.", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Gagal memperbarui data.", type: "error" });
    }
  };

  const openConvert = (f: RequestFinding) => {
    if (!request) return;
    const parsed = parsePrice(f.price);
    const quantity = request.quantity ?? 0;
    const matchedSupplier = suppliers.find(
      (s) => s.companyName.trim().toLowerCase() === (f.supplierName || "").trim().toLowerCase()
    );
    setConvertDraft({
      dealName: `${request.title}${f.supplierName ? " — " + f.supplierName : ""}`.trim(),
      buyerId: request.buyerId || "",
      supplierId: matchedSupplier?.id || "",
      transactionValue: parsed != null ? parsed * (quantity > 0 ? quantity : 1) : 0,
      currency: "USD",
      commissionType: "Percentage of Transaction Value",
      commissionRate: 2,
      quantity,
      payer: buyer?.companyName || "",
      expectedPaymentDate: request.neededBy ? request.neededBy.slice(0, 10) : "",
      createDeal: true,
    });
    setConvertFinding(f);
  };

  const saveConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !convertFinding) return;
    if (!convertDraft.dealName.trim()) { setToast({ message: "Nama deal wajib diisi.", type: "error" }); return; }
    if (!convertDraft.buyerId || !convertDraft.supplierId) { setToast({ message: "Pilih buyer dan supplier dulu.", type: "error" }); return; }
    setConvertSaving(true);
    try {
      const amount = commissionAmountOf(convertDraft);
      if (!Number.isFinite(amount) || amount < 0) throw new Error("Jumlah komisi tidak valid.");
      const now = new Date().toISOString();
      const commission: Commission = {
        id: uuid(),
        dealName: convertDraft.dealName.trim(),
        buyerId: convertDraft.buyerId,
        supplierId: convertDraft.supplierId,
        productId: null,
        transactionValue: Number(convertDraft.transactionValue) || 0,
        commissionType: convertDraft.commissionType,
        commissionRate: Number(convertDraft.commissionRate) || 0,
        commissionAmount: amount,
        payer: convertDraft.payer.trim(),
        expectedPaymentDate: convertDraft.expectedPaymentDate,
        actualPaymentDate: null,
        commissionStatus: "Potential",
        internalNotes: `Dari temuan kebutuhan "${request.title}"${convertFinding.supplierName ? " — " + convertFinding.supplierName : ""}`,
        currency: convertDraft.currency,
        demo: false,
      };
      await addCommission(commission);
      if (convertDraft.createDeal) {
        const deal: Deal = {
          id: uuid(),
          name: convertDraft.dealName.trim(),
          buyerId: convertDraft.buyerId,
          supplierId: convertDraft.supplierId,
          productId: null,
          dealValue: Number(convertDraft.transactionValue) || 0,
          dealStatus: "Prospecting",
          expectedClose: convertDraft.expectedPaymentDate || now,
          currency: convertDraft.currency,
          demo: false,
        };
        await addDeal(deal);
      }
      setConvertFinding(null);
      setToast({ message: convertDraft.createDeal ? "Deal & komisi dibuat." : "Komisi dibuat.", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Gagal membuat komisi.", type: "error" });
    } finally {
      setConvertSaving(false);
    }
  };

  const buildWhatsAppMessage = (): string => {
    if (!request) return "";
    const lines: string[] = [];
    lines.push(`Halo, terkait kebutuhan *${request.title}*`);
    if (request.quantity) lines.push(`Qty: ${request.quantity} ${request.unit}`);
    if (request.specs) lines.push(`Spesifikasi: ${request.specs}`);
    if (request.neededBy) lines.push(`Dibutuhkan sebelum: ${new Date(request.neededBy).toLocaleDateString("id-ID")}`);
    if (request.notes) lines.push(`Catatan: ${request.notes}`);
    const usable = requestFindings.filter((f) => f.status !== "Rejected" && (f.price || f.foundSpecs || f.supplierName));
    if (usable.length) {
      lines.push("", "*Opsi temuan:*");
      usable.forEach((f, i) => {
        const parts: string[] = [];
        if (f.supplierName) parts.push(f.supplierName);
        if (f.foundSpecs) parts.push(f.foundSpecs);
        if (f.price) parts.push(`Harga: ${f.price}`);
        if (f.moq) parts.push(`MOQ: ${f.moq}`);
        if (f.availability) parts.push(`Avail: ${f.availability}`);
        lines.push(`${i + 1}. ${parts.join(" | ")}`);
      });
    }
    return lines.join("\n");
  };

  const openWhatsApp = () => {
    setWaPhone(normalizePhone(buyer?.whatsapp || ""));
    setWaMessage(buildWhatsAppMessage());
    setWaOpen(true);
  };

  const sendWhatsApp = () => {
    const digits = normalizePhone(waPhone);
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(waMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onFilesChange = (selected: File[]) => {
    setFiles(selected);
    setCompressing({});
    const oversize = selected.find((f) => f.size > MAX_MEDIA_BYTES);
    if (oversize) setError(`${oversize.name} melebihi 1MB. Klik Kompres pada file tersebut.`);
    else setError("");
  };

  const compressFileAt = async (index: number) => {
    const file = files[index];
    if (!file) return;
    setCompressing((c) => ({ ...c, [index]: true }));
    setError("");
    try {
      const compressed = await compressMediaFile(file);
      setFiles((prev) => prev.map((f, i) => (i === index ? compressed : f)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal kompres file.");
    } finally {
      setCompressing((c) => ({ ...c, [index]: false }));
    }
  };

  if (!request) return <div className="p-6"><p className="text-[#333]">Kebutuhan tidak ditemukan.</p><Link href="/requests" className="text-sm text-black underline">Kembali</Link></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2"><Link href="/requests" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[#ffe66d]"><ArrowLeft className="w-4 h-4" /></Link><div className="flex-1"><h1 className="text-xl font-semibold text-black">{request.title}</h1><p className="text-sm text-[#333]">{buyer?.companyName || request.buyerName || "Internal"} · {request.quantity ?? "-"} {request.unit}</p></div><div className="flex items-center gap-2 shrink-0"><Button size="sm" variant="outline" onClick={openWhatsApp}><MessageCircle className="w-4 h-4 mr-1" />WhatsApp</Button><Badge variant="outline">{request.status}</Badge></div></div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1"><CardHeader><CardTitle className="text-base">Detail Kebutuhan</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
          <div><div className="text-[#333]">Status</div><Select value={request.status} onValueChange={(v)=>{ if (v) void setRequestStatus(v as RequestStatus); }}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{RSTATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div><div className="text-[#333]">Dibutuhkan sebelum</div><div className="flex items-center gap-2 mt-1"><span>{request.neededBy ? new Date(request.neededBy).toLocaleDateString("id-ID") : "-"}</span>{requestDeadline && <Badge variant="outline" className={`text-[10px] ${requestDeadline.cls}`}>{requestDeadline.label}</Badge>}</div></div>
          <div><div className="text-[#333]">Spesifikasi</div><div className="whitespace-pre-wrap">{request.specs || "-"}</div></div>
          <div><div className="text-[#333]">Catatan</div><div className="whitespace-pre-wrap">{request.notes || "-"}</div></div>
          <div><div className="text-[#333] mb-2">Media Permintaan</div><MediaGrid items={request.requestMedia || []} onDelete={onDeleteRequestMedia} /></div>
        </CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Temuan / Sourcing</CardTitle><Button size="sm" onClick={()=>setOpen(true)}><Plus className="w-4 h-4 mr-2" />Tambah Temuan</Button></CardHeader><CardContent className="space-y-4">
          {requestFindings.length === 0 ? <p className="text-sm text-[#333]">Belum ada temuan. Tambahkan foto/video/spek supplier yang ditemukan.</p> : requestFindings.map((f) => (
            <div key={f.id} className="border rounded-[4px] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3"><div><div className="font-medium text-black flex items-center gap-2 flex-wrap">{f.supplierName || "Sumber belum diisi"}{cheapestFindingId === f.id && <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]"><Crown className="w-3 h-3 mr-1" />Termurah</Badge>}</div><div className="text-xs text-[#333]">{new Date(f.createdAt).toLocaleString("id-ID")} · {f.createdBy}</div></div><div className="flex items-center gap-2">{f.status === "Matched" && <Button size="sm" variant="outline" onClick={()=>openConvert(f)}><TrendingUp className="w-4 h-4 mr-1" />Jadikan Komisi</Button>}<Select value={f.status} onValueChange={(v)=>{ if (v) void setFindingStatus(f,v as FindingStatus); }}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent>{FSTATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><Button size="icon" variant="ghost" onClick={()=>onDeleteFinding(f)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></div>
              <div className="text-sm whitespace-pre-wrap">{f.foundSpecs || "-"}</div>
              <div className="grid md:grid-cols-3 gap-2 text-xs text-[#333]"><div>Harga: <span className="text-brand-foreground">{f.price || "-"}</span></div><div>MOQ: <span className="text-brand-foreground">{f.moq || "-"}</span></div><div>Ketersediaan: <span className="text-brand-foreground">{f.availability || "-"}</span></div></div>
              {f.notes && <div className="text-xs text-[#333]">Catatan: {f.notes}</div>}
              <MediaGrid items={f.foundMedia || []} onDelete={(m) => onDeleteFindingMedia(f, m)} />
            </div>
          ))}
        </CardContent></Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Tambah Temuan</DialogTitle></DialogHeader>
        <form onSubmit={saveFinding} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Supplier / Sumber</Label><Input value={form.supplierName} onChange={(e)=>setForm({...form,supplierName:e.target.value})} placeholder="Nama supplier / pabrik / trader" /></div><div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v)=>{ if (v) setForm({...form,status:v as FindingStatus}); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FSTATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="space-y-2"><Label>Spek yang didapat</Label><Textarea rows={4} value={form.foundSpecs} onChange={(e)=>setForm({...form,foundSpecs:e.target.value})} placeholder="Spek aktual, packing, asal, catatan inspeksi..." /></div>
          <div className="grid md:grid-cols-3 gap-4"><div className="space-y-2"><Label>Harga</Label><Input value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} /></div><div className="space-y-2"><Label>MOQ</Label><Input value={form.moq} onChange={(e)=>setForm({...form,moq:e.target.value})} /></div><div className="space-y-2"><Label>Ketersediaan</Label><Input value={form.availability} onChange={(e)=>setForm({...form,availability:e.target.value})} /></div></div>
          <div className="space-y-2"><Label>Catatan</Label><Textarea rows={2} value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} /></div>
          <div className="space-y-2">
            <Label>Foto/Video temuan (max {MAX_MEDIA_BYTES/1024/1024}MB/file)</Label>
            <Input type="file" accept="image/*,video/*" multiple onChange={(e)=>onFilesChange(Array.from(e.target.files||[]))} />
            {files.length > 0 && <div className="space-y-2">
              {files.map((f, i) => {
                const over = f.size > MAX_MEDIA_BYTES;
                return <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs">
                  <div className="min-w-0"><div className="truncate font-medium">{f.name}</div><div className={over ? "text-red-600" : "text-[#333]"}>{formatBytes(f.size)}{over ? " · melebihi 1MB" : ""}</div></div>
                  <div className="flex items-center gap-2 shrink-0">
                    {over && <Button type="button" size="sm" variant="outline" disabled={!!compressing[i]} onClick={()=>compressFileAt(i)}>{compressing[i] ? "Mengompres..." : "Kompres"}</Button>}
                    <Button type="button" size="sm" variant="ghost" onClick={()=>setFiles((prev)=>prev.filter((_,idx)=>idx!==i))}>Hapus</Button>
                  </div>
                </div>;
              })}
            </div>}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Batal</Button><Button type="submit" disabled={saving}>{saving?"Menyimpan...":"Simpan Temuan"}</Button></div>
        </form>
      </DialogContent></Dialog>

      <Dialog open={!!convertFinding} onOpenChange={(o) => { if (!o) setConvertFinding(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Jadikan Komisi</DialogTitle></DialogHeader>
          <form onSubmit={saveConvert} className="space-y-4">
            <div className="space-y-2"><Label>Nama Deal</Label><Input value={convertDraft.dealName} onChange={(e)=>setConvertDraft({...convertDraft, dealName: e.target.value})} required /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Buyer</Label><Select value={convertDraft.buyerId} onValueChange={(v)=>setConvertDraft({...convertDraft, buyerId: v ?? ""})}><SelectTrigger><SelectValue placeholder="Pilih buyer" /></SelectTrigger><SelectContent>{buyers.map(b=><SelectItem key={b.id} value={b.id}>{b.companyName}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Supplier</Label><Select value={convertDraft.supplierId} onValueChange={(v)=>setConvertDraft({...convertDraft, supplierId: v ?? ""})}><SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger><SelectContent>{suppliers.map(s=><SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2"><Label>Nilai Transaksi</Label><Input type="number" min="0" value={convertDraft.transactionValue} onChange={(e)=>setConvertDraft({...convertDraft, transactionValue: Number(e.target.value)})} /><p className="text-[11px] text-[#333]">Terisi otomatis dari harga temuan × qty. Sesuaikan bila perlu.</p></div>
              <div className="space-y-2"><Label>Currency</Label><Select value={convertDraft.currency} onValueChange={(v)=>{ if (v) setConvertDraft({...convertDraft, currency: v as "IDR" | "USD"}); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="IDR">IDR</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2"><Label>Tipe Komisi</Label><Select value={convertDraft.commissionType} onValueChange={(v)=>{ if (v) setConvertDraft({...convertDraft, commissionType: v as CommissionType}); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMMISSION_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>{convertDraft.commissionType === "Percentage of Transaction Value" ? "Rate (%)" : convertDraft.commissionType === "Fee per Ton" ? "Fee / ton" : "Nominal"}</Label><Input type="number" min="0" value={convertDraft.commissionRate} onChange={(e)=>setConvertDraft({...convertDraft, commissionRate: Number(e.target.value)})} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Pembayar Komisi</Label><Input value={convertDraft.payer} onChange={(e)=>setConvertDraft({...convertDraft, payer: e.target.value})} placeholder="Buyer / supplier" /></div>
              <div className="space-y-2"><Label>Perkiraan Pembayaran</Label><Input type="date" value={convertDraft.expectedPaymentDate} onChange={(e)=>setConvertDraft({...convertDraft, expectedPaymentDate: e.target.value})} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={convertDraft.createDeal} onChange={(e)=>setConvertDraft({...convertDraft, createDeal: e.target.checked})} />Buat juga sebagai Deal (muncul di pipeline dashboard)</label>
            <div className="rounded-[4px] border bg-[#f5f0e1] p-3 text-sm"><span className="text-[#333]">Perkiraan komisi: </span><span className="font-semibold text-black">{new Intl.NumberFormat(convertDraft.currency === "IDR" ? "id-ID" : "en-US", { style: "currency", currency: convertDraft.currency, maximumFractionDigits: convertDraft.currency === "IDR" ? 0 : 2 }).format(commissionAmountOf(convertDraft))}</span></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setConvertFinding(null)}>Batal</Button><Button type="submit" disabled={convertSaving}>{convertSaving ? "Menyimpan..." : "Buat"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={waOpen} onOpenChange={setWaOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Kirim WhatsApp</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Nomor WhatsApp</Label><Input value={waPhone} onChange={(e)=>setWaPhone(e.target.value)} placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx" /><p className="text-[11px] text-[#333]">Kosongkan untuk memilih kontak manual di WhatsApp.</p></div>
            <div className="space-y-2"><Label>Pesan</Label><Textarea rows={12} value={waMessage} onChange={(e)=>setWaMessage(e.target.value)} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setWaOpen(false)}>Batal</Button><Button type="button" onClick={sendWhatsApp}><MessageCircle className="w-4 h-4 mr-1" />Buka WhatsApp</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <div className="fixed bottom-4 right-4 z-[100] w-[360px]">
          <div className={`flex items-center gap-2 p-3 rounded-[4px] border text-sm shadow-sm ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            <span className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="text-sm">{toast.message}</span>
            <button className="ml-auto opacity-70 hover:opacity-100" onClick={() => setToast(null)}>
              <span className="sr-only">Tutup</span>×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
