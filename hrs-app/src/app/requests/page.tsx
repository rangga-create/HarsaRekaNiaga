"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Eye, Pencil, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth, useBuyers, useBuyerRequests } from "@/lib/firebase-store";
import { uploadMediaFiles, deleteMediaFiles, compressMediaFile, formatBytes, MAX_MEDIA_BYTES } from "@/lib/storage";
import type { BuyerRequest, RequestStatus } from "@/lib/data";
import { daysUntil } from "@/lib/utils";
import { v4 as uuid } from "uuid";

const STATUSES: RequestStatus[] = ["Open", "Sourcing", "Found", "Matched", "Closed"];
const EMPTY = { buyerId: "internal", title: "", quantity: "", unit: "ton", specs: "", neededBy: "", notes: "", status: "Open" as RequestStatus };

function deadlineInfo(r: BuyerRequest) {
  if (!r.neededBy || r.status === "Closed") return null;
  const days = daysUntil(r.neededBy);
  if (days === null) return null;
  if (days < 0)
    return { days, label: `Lewat ${Math.abs(days)} hari`, cls: "bg-red-50 text-red-800 border-red-200" };
  if (days === 0)
    return { days, label: "Hari ini", cls: "bg-amber-50 text-amber-800 border-amber-200" };
  if (days <= 7)
    return { days, label: `${days} hari lagi`, cls: "bg-amber-50 text-amber-800 border-amber-200" };
  return null;
}

export default function RequestsPage() {
  const { user } = useAuth();
  const { list: buyers } = useBuyers();
  const { list: requests, add, update, remove, loading } = useBuyerRequests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BuyerRequest | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [compressing, setCompressing] = useState<Record<number, boolean>>({});

  const filtered = useMemo(() => requests.filter((r) => {
    const q = search.toLowerCase();
    const buyer = buyers.find((b) => b.id === r.buyerId)?.companyName || r.buyerName || "Internal";
    const info = deadlineInfo(r);
    const deadlineMatch = deadlineFilter === "all"
      || (deadlineFilter === "overdue" && !!info && info.days < 0)
      || (deadlineFilter === "soon" && !!info && info.days >= 0);
    return (!q || r.title.toLowerCase().includes(q) || buyer.toLowerCase().includes(q) || r.specs.toLowerCase().includes(q))
      && (statusFilter === "all" || r.status === statusFilter)
      && deadlineMatch;
  }).sort((a,b)=> (b.updatedAt||b.createdAt||"").localeCompare(a.updatedAt||a.createdAt||"")), [requests, buyers, search, statusFilter, deadlineFilter]);

  const overdueCount = useMemo(() => requests.filter((r) => (deadlineInfo(r)?.days ?? 0) < 0).length, [requests]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFiles([]); setError(""); setCompressing({}); setOpen(true); };
  const openEdit = (r: BuyerRequest) => {
    setEditing(r); setError(""); setFiles([]); setCompressing({});
    setForm({ buyerId: r.buyerId || "internal", title: r.title, quantity: r.quantity?.toString() || "", unit: r.unit || "ton", specs: r.specs || "", neededBy: r.neededBy?.slice(0,10) || "", notes: r.notes || "", status: r.status });
    setOpen(true);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const buyer = buyers.find((b) => b.id === form.buyerId);
      const media = files.length ? await uploadMediaFiles(files, "requests") : [];
      const now = new Date().toISOString();
      const payload = {
        buyerId: form.buyerId === "internal" ? null : form.buyerId,
        buyerName: buyer?.companyName || "Internal",
        title: form.title.trim(),
        quantity: form.quantity ? Number(form.quantity) : null,
        unit: form.unit.trim() || "ton",
        specs: form.specs.trim(),
        status: form.status,
        neededBy: form.neededBy ? new Date(form.neededBy).toISOString() : "",
        notes: form.notes.trim(),
        updatedAt: now,
      };
      if (editing) {
        await update(editing.id, { ...payload, requestMedia: [...(editing.requestMedia || []), ...media] } as Partial<BuyerRequest>);
      } else {
        const newRequest: BuyerRequest = { id: uuid(), ...payload, requestMedia: media, createdBy: user?.email || "admin", createdAt: now, demo: false };
        await add(newRequest);
      }
      setOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); }
    finally { setSaving(false); }
  };

  const onDelete = async (r: BuyerRequest) => {
    if (!confirm(`Hapus kebutuhan "${r.title}"?`)) return;
    try { await deleteMediaFiles(r.requestMedia || []); } catch (err) { setError(err instanceof Error ? err.message : "Gagal hapus media."); return; } await remove(r.id);
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

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold text-black">Kebutuhan Buyer</h1><p className="text-sm text-[#333]">Catat permintaan buyer/internal, cari supply, lalu cocokkan temuan.</p>{overdueCount > 0 && <p className="text-xs font-medium text-red-600 mt-1">{overdueCount} kebutuhan sudah lewat deadline.</p>}</div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Tambah Kebutuhan</Button>
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]" /><Input className="pl-9" placeholder="Cari komoditas, buyer, spek..." value={search} onChange={(e)=>setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={(v)=>setStatusFilter(v ?? "all")}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={deadlineFilter} onValueChange={(v)=>setDeadlineFilter(v ?? "all")}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Deadline" /></SelectTrigger><SelectContent><SelectItem value="all">Semua deadline</SelectItem><SelectItem value="overdue">Lewat deadline</SelectItem><SelectItem value="soon">≤ 7 hari</SelectItem></SelectContent></Select>
      </div>
      <div className="border border-black rounded-[4px] bg-[#fffdf5] overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Kebutuhan</TableHead><TableHead>Buyer</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead><TableHead>Butuh</TableHead><TableHead className="w-[120px]">Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-[#333]">Memuat...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={6}><div className="py-12 text-center"><ClipboardList className="w-10 h-10 mx-auto text-[#333] mb-2" /><p className="text-sm text-[#333]">Belum ada kebutuhan.</p></div></TableCell></TableRow>
            : filtered.map((r) => {
              const buyer = buyers.find((b)=>b.id===r.buyerId)?.companyName || r.buyerName || "Internal";
              const info = deadlineInfo(r);
              return <TableRow key={r.id}>
                <TableCell><div className="font-medium text-black">{r.title}</div><div className="text-xs text-[#333] line-clamp-1">{r.specs || "-"}</div></TableCell>
                <TableCell>{buyer}</TableCell>
                <TableCell>{r.quantity ?? "-"} {r.unit}</TableCell>
                <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                <TableCell><div className="space-y-1"><div>{r.neededBy ? new Date(r.neededBy).toLocaleDateString("id-ID") : "-"}</div>{info && <Badge variant="outline" className={`text-[10px] ${info.cls}`}>{info.label}</Badge>}</div></TableCell>
                <TableCell><div className="flex gap-1"><Link href={`/requests/${r.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[#ffe66d]"><Eye className="w-4 h-4" /></Link><Button size="icon" variant="ghost" onClick={()=>openEdit(r)}><Pencil className="w-4 h-4" /></Button><Button size="icon" variant="ghost" onClick={()=>onDelete(r)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Kebutuhan" : "Tambah Kebutuhan"}</DialogTitle></DialogHeader>
          <form onSubmit={onSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Buyer</Label><Select value={form.buyerId} onValueChange={(v)=>setForm({...form,buyerId:v ?? "internal"})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="internal">Internal / Belum ada buyer</SelectItem>{buyers.map(b=><SelectItem key={b.id} value={b.id}>{b.companyName}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v)=>{ if (v) setForm({...form,status:v as RequestStatus}); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Komoditas / Kebutuhan</Label><Input required value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="Bungkil sawit" /></div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Qty</Label><Input type="number" min="0" value={form.quantity} onChange={(e)=>setForm({...form,quantity:e.target.value})} placeholder="100" /></div>
              <div className="space-y-2"><Label>Satuan</Label><Input value={form.unit} onChange={(e)=>setForm({...form,unit:e.target.value})} placeholder="ton" /></div>
              <div className="space-y-2"><Label>Butuh sebelum</Label><Input type="date" value={form.neededBy} onChange={(e)=>setForm({...form,neededBy:e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Spesifikasi</Label><Textarea rows={4} value={form.specs} onChange={(e)=>setForm({...form,specs:e.target.value})} placeholder="Protein min..., kadar air..., packing..." /></div>
            <div className="space-y-2"><Label>Catatan</Label><Textarea rows={2} value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} /></div>
            <div className="space-y-2">
              <Label>Foto/Video permintaan (max {MAX_MEDIA_BYTES/1024/1024}MB/file)</Label>
              <Input type="file" accept="image/*,video/*" multiple onChange={(e)=>onFilesChange(Array.from(e.target.files||[]))} />
              {files.length > 0 && <div className="space-y-2">
                {files.map((f, i) => {
                  const over = f.size > MAX_MEDIA_BYTES;
                  return <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs">
                    <div className="min-w-0"><div className="truncate font-medium">{f.name}</div><div className={over ? "text-red-600" : "text-[#333]"}>{formatBytes(f.size)}{over ? " Â· melebihi 1MB" : ""}</div></div>
                    <div className="flex items-center gap-2 shrink-0">
                      {over && <Button type="button" size="sm" variant="outline" disabled={!!compressing[i]} onClick={()=>compressFileAt(i)}>{compressing[i] ? "Mengompres..." : "Kompres"}</Button>}
                      <Button type="button" size="sm" variant="ghost" onClick={()=>setFiles((prev)=>prev.filter((_,idx)=>idx!==i))}>Hapus</Button>
                    </div>
                  </div>;
                })}
              </div>}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Batal</Button><Button type="submit" disabled={saving}>{saving?"Menyimpan...":"Simpan"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

