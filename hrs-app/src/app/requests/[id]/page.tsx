"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useBuyerRequests, useBuyers, useRequestFindings } from "@/lib/firebase-store";
import { deleteMediaFiles, uploadMediaFiles, compressMediaFile, formatBytes, MAX_MEDIA_BYTES } from "@/lib/storage";
import type { BuyerRequest, FindingStatus, MediaAttachment, RequestFinding, RequestStatus } from "@/lib/data";
import { v4 as uuid } from "uuid";

const RSTATUSES: RequestStatus[] = ["Open", "Sourcing", "Found", "Matched", "Closed"];
const FSTATUSES: FindingStatus[] = ["Submitted", "Reviewed", "Matched", "Rejected"];

function MediaGrid({ items }: { items: MediaAttachment[] }) {
  if (!items?.length) return <p className="text-sm text-[#333]">Tidak ada media.</p>;
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{items.map((m) => <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="block border rounded-[4px] overflow-hidden bg-[#f5f0e1]">
    {m.type === "video" ? <video src={m.url} className="w-full h-32 object-cover" controls /> : <img src={m.url} alt={m.name} className="w-full h-32 object-cover" loading="lazy" />}
    <div className="p-2 text-[11px] truncate text-[#333]">{m.name}</div>
  </a>)}</div>;
}

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { list: requests, update: updateRequest } = useBuyerRequests();
  const { list: buyers } = useBuyers();
  const { list: findings, add: addFinding, update: updateFinding, remove: removeFinding } = useRequestFindings();
  const request = requests.find((r) => r.id === id);
  const buyer = buyers.find((b) => b.id === request?.buyerId);
  const requestFindings = useMemo(() => findings.filter((f) => f.requestId === id).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||"")), [findings, id]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [compressing, setCompressing] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState({ supplierName: "", foundSpecs: "", price: "", availability: "", moq: "", notes: "", status: "Submitted" as FindingStatus });

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
      <div className="flex items-center gap-2"><Link href="/requests" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[#ffe66d]"><ArrowLeft className="w-4 h-4" /></Link><div className="flex-1"><h1 className="text-xl font-semibold text-black">{request.title}</h1><p className="text-sm text-[#333]">{buyer?.companyName || request.buyerName || "Internal"} · {request.quantity ?? "-"} {request.unit}</p></div><Badge variant="outline">{request.status}</Badge></div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1"><CardHeader><CardTitle className="text-base">Detail Kebutuhan</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
          <div><div className="text-[#333]">Status</div><Select value={request.status} onValueChange={(v)=>{ if (v) void setRequestStatus(v as RequestStatus); }}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{RSTATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div><div className="text-[#333]">Spesifikasi</div><div className="whitespace-pre-wrap">{request.specs || "-"}</div></div>
          <div><div className="text-[#333]">Catatan</div><div className="whitespace-pre-wrap">{request.notes || "-"}</div></div>
          <div><div className="text-[#333] mb-2">Media Permintaan</div><MediaGrid items={request.requestMedia || []} /></div>
        </CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Temuan / Sourcing</CardTitle><Button size="sm" onClick={()=>setOpen(true)}><Plus className="w-4 h-4 mr-2" />Tambah Temuan</Button></CardHeader><CardContent className="space-y-4">
          {requestFindings.length === 0 ? <p className="text-sm text-[#333]">Belum ada temuan. Tambahkan foto/video/spek supplier yang ditemukan.</p> : requestFindings.map((f) => (
            <div key={f.id} className="border rounded-[4px] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3"><div><div className="font-medium text-black">{f.supplierName || "Sumber belum diisi"}</div><div className="text-xs text-[#333]">{new Date(f.createdAt).toLocaleString("id-ID")} · {f.createdBy}</div></div><div className="flex items-center gap-2"><Select value={f.status} onValueChange={(v)=>{ if (v) void setFindingStatus(f,v as FindingStatus); }}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent>{FSTATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><Button size="icon" variant="ghost" onClick={()=>onDeleteFinding(f)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></div>
              <div className="text-sm whitespace-pre-wrap">{f.foundSpecs || "-"}</div>
              <div className="grid md:grid-cols-3 gap-2 text-xs text-[#333]"><div>Harga: <span className="text-brand-foreground">{f.price || "-"}</span></div><div>MOQ: <span className="text-brand-foreground">{f.moq || "-"}</span></div><div>Ketersediaan: <span className="text-brand-foreground">{f.availability || "-"}</span></div></div>
              {f.notes && <div className="text-xs text-[#333]">Catatan: {f.notes}</div>}
              <MediaGrid items={f.foundMedia || []} />
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
    </div>
  );
}
