"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  RotateCcw,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCalculatorScenarios, useActivityLogs } from "@/lib/firebase-store";
import type { Incoterm } from "@/lib/data";
import { v4 as uuid } from "uuid";
import { calcTrader } from "@/lib/calc";
import type { TraderCalcInput } from "@/lib/calc";

const INCOTERMS: Incoterm[] = ["EXW", "FCA", "FOB", "CFR", "CIF"];

const INCOTERM_INFO: Record<Incoterm, string> = {
  EXW: "Ex Works — penjual menjadikan barang tersedia di lokasinya. Pembeli menanggung semua biaya dari titik itu.",
  FCA: "Free Carrier — penjual menyerahkan barang ke penerima angkutan, menanggung biaya hingga titik tersebut.",
  FOB: "Free On Board — penjual menyerahkan barang ke atas kapal.",
  CFR: "Cost and Freight — penjual membayar ongkir ke pelabuhan tujuan.",
  CIF: "Cost, Insurance, and Freight — penjual membayar ongkir dan asuransi ke pelabuhan tujuan.",
};

const INITIAL_TRADER_FORM: TraderCalcInput = {
  productCost: 0,
  quantity: 0,
  packagingCost: 0,
  inlandTransportation: 0,
  exportHandling: 0,
  freightCost: 0,
  insurance: 0,
  documentationCost: 0,
  otherCosts: 0,
  desiredProfitMargin: 10,
  incoterm: "FOB",
  currency: "IDR",
  exchangeRate: 15500,
};

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm">
          <Skeleton className="h-4 w-[120px] mb-2" />
          <Skeleton className="h-6 w-[160px]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-black rounded-[4px] bg-brand-muted/20">
      <div className="w-12 h-12 rounded-full bg-brand-forest/10 flex items-center justify-center mb-4">
        <Calculator className="w-6 h-6 text-black" />
      </div>
      <h3 className="text-base font-semibold text-black mb-1">Calculator siap digunakan</h3>
      <p className="text-sm text-[#333] max-w-xs">
        Masukkan nilai di atas untuk melihat hasil estimasi biaya ekspor.
      </p>
    </div>
  );
}

export default function CalculatorPage() {
  const { add: addScenario, refresh } = useCalculatorScenarios();
  const { add: addActivityLog } = useActivityLogs();

  const [traderForm, setTraderForm] = useState(INITIAL_TRADER_FORM);
  const [traderResult, setTraderResult] = useState<ReturnType<typeof calcTrader> | null>(null);
  const [traderError, setTraderError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [exchangeRateInput, setExchangeRateInput] = useState(traderForm.exchangeRate.toString());

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const traderInput = useMemo(
    () => ({
      ...traderForm,
      exchangeRate: parseFloat(exchangeRateInput) || 0,
    }),
    [traderForm, exchangeRateInput]
  );

  useEffect(() => {
    setTraderError(null);
    setTraderResult(null);
    if (
      traderInput.productCost > 0 ||
      traderInput.quantity > 0 ||
      traderInput.packagingCost > 0 ||
      traderInput.inlandTransportation > 0 ||
      traderInput.exportHandling > 0 ||
      traderInput.freightCost > 0 ||
      traderInput.insurance > 0 ||
      traderInput.documentationCost > 0 ||
      traderInput.otherCosts > 0 ||
      traderInput.desiredProfitMargin > 0
    ) {
      try {
        const result = calcTrader(traderInput);
        setTraderResult(result);
      } catch (e) {
        setTraderError(e instanceof Error ? e.message : "Input tidak valid");
      }
    }
  }, [traderInput]);

  const handleReset = () => {
    setTraderForm(INITIAL_TRADER_FORM);
    setTraderResult(null);
    setTraderError(null);
    setExchangeRateInput(INITIAL_TRADER_FORM.exchangeRate.toString());
  };

  const handleSaveScenario = () => {
    setSaving(true);
    try {
      addScenario({
        id: uuid(),
        name: `Export scenario ${new Date().toISOString().split("T")[0]}`,
        mode: "Trader",
        payload: traderForm,
        createdAt: new Date().toISOString(),
        demo: true,
      });
      addActivityLog({
        id: uuid(),
        action: "Calculator scenario saved",
        entity: "Calculator",
        entityId: uuid(),
        description: "Export calculator scenario saved",
        createdAt: new Date().toISOString(),
        demo: true,
      });
      setToast({ message: "Scenario ekspor tersimpan", type: "success" });
      refresh();
    } catch {
      setToast({ message: "Gagal menyimpan scenario", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-[4px] bg-brand-forest text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-black tracking-tight">Export Calculator</h1>
              <p className="text-sm text-[#333] mt-1">
                Hitung estimasi biaya transaksi ekspor, harga jual, dan keuntungan.
              </p>
            </div>
          </div>        </div>

        {/* Export calculator */}
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="productCost">Biaya Produk</Label>
              <Input
                id="productCost"
                type="number"
                min="0"
                step="0.01"
                value={traderForm.productCost || ""}
                onChange={(e) =>
                  setTraderForm({
                    ...traderForm,
                    productCost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Kuantitas</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={traderForm.quantity || ""}
                onChange={(e) =>
                  setTraderForm({
                    ...traderForm,
                    quantity: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="packagingCost">Biaya Kemasan</Label>
              <Input
                id="packagingCost"
                type="number"
                min="0"
                step="0.01"
                value={traderForm.packagingCost || ""}
                onChange={(e) =>
                  setTraderForm({
                    ...traderForm,
                    packagingCost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="inlandTransportation">Transport Dalam Negeri</Label>
              <Input
                id="inlandTransportation"
                type="number"
                min="0"
                step="0.01"
                value={traderForm.inlandTransportation || ""}
                onChange={(e) =>
                  setTraderForm({
                    ...traderForm,
                    inlandTransportation: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exportHandling">Handling Ekspor</Label>
              <Input
                id="exportHandling"
                type="number"
                min="0"
                step="0.01"
                value={traderForm.exportHandling || ""}
                onChange={(e) =>
                  setTraderForm({
                    ...traderForm,
                    exportHandling: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freightCost">Biaya Freight</Label>
              <Input
                id="freightCost"
                type="number"
                min="0"
                step="0.01"
                value={traderForm.freightCost || ""}
                onChange={(e) =>
                  setTraderForm({
                    ...traderForm,
                    freightCost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="insurance">Asuransi</Label>
              <Input
                id="insurance"
                type="number"
                min="0"
                step="0.01"
                value={traderForm.insurance || ""}
                onChange={(e) =>
                  setTraderForm({
                    ...traderForm,
                    insurance: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="documentationCost">Biaya Dokumentasi</Label>
              <Input
                id="documentationCost"
                type="number"
                min="0"
                step="0.01"
                value={traderForm.documentationCost || ""}
                onChange={(e) =>
                  setTraderForm({
                    ...traderForm,
                    documentationCost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="otherCosts">Biaya Lainnya</Label>
              <Input
                id="otherCosts"
                type="number"
                min="0"
                step="0.01"
                value={traderForm.otherCosts || ""}
                onChange={(e) =>
                  setTraderForm({
                    ...traderForm,
                    otherCosts: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Incoterm</Label>
              <Select
                value={traderForm.incoterm}
                onValueChange={(v) =>
                  setTraderForm({
                    ...traderForm,
                    incoterm: v as Incoterm,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOTERMS.map((inc) => (
                    <SelectItem key={inc} value={inc}>{inc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[#333] mt-1">
                {INCOTERM_INFO[traderForm.incoterm]}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desiredProfitMargin">Margin Keuntungan Diinginkan (%)</Label>
              <Input
                id="desiredProfitMargin"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={traderForm.desiredProfitMargin || ""}
                onChange={(e) =>
                  setTraderForm({
                    ...traderForm,
                    desiredProfitMargin: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="10"
              />
            </div>
          </div>
          <Button variant="outline" className="w-auto" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>

          <Separator className="border-black" />

          {/* Results */}
          <div className="grid gap-4 sm:grid-cols-2">
            {traderResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm">
                  <h3 className="text-sm font-semibold text-black mb-3">Hasil</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-[#333] mb-1">Total Biaya Estimasi</div>
                      <div className="text-lg font-semibold text-black">
                        {traderForm.currency === "IDR"
                          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(traderResult.totalEstimatedCost)
                          : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(traderResult.totalEstimatedCost)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#333] mb-1">Biaya per Unit</div>
                      <div className="text-sm font-medium text-black">
                        {traderForm.currency === "IDR"
                          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 }).format(traderResult.costPerUnit)
                          : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(traderResult.costPerUnit)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#333] mb-1">Estimasi Harga Jual</div>
                      <div className="text-lg font-semibold text-black">
                        {traderForm.currency === "IDR"
                          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(traderResult.estimatedSellingPrice)
                          : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(traderResult.estimatedSellingPrice)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#333] mb-1">Estimasi Laba Kotor</div>
                      <div className="text-lg font-semibold text-black">
                        {traderForm.currency === "IDR"
                          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(traderResult.estimatedGrossProfit)
                          : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(traderResult.estimatedGrossProfit)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#333] mb-1">Margin Kotor</div>
                      <div className="text-sm font-medium text-black">
                        {traderResult.grossMargin}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#333] mb-1">Estimasi Laba per Unit</div>
                      <div className="text-sm font-medium text-black">
                        {traderForm.currency === "IDR"
                          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 }).format(traderResult.estimatedProfitPerUnit)
                          : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(traderResult.estimatedProfitPerUnit)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm">
                  <h3 className="text-sm font-semibold text-black mb-3">Biaya yang Dikaitkan (Penjual)</h3>
                  <div className="space-y-1">
                    {traderResult.sellerPaidCosts.map((cost, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-[#333]">{cost.label}</span>
                        <span className="font-medium text-black">
                          {cost.amount > 0
                            ? traderForm.currency === "IDR"
                              ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(cost.amount)
                              : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(cost.amount)
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="border-black my-3" />
                  <h3 className="text-sm font-semibold text-black mb-2">Biaya yang Dibebankan Pembeli</h3>
                  {traderResult.buyerPaidCosts.length > 0 ? (
                    <div className="space-y-1">
                      {traderResult.buyerPaidCosts.map((cost, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-[#333]">{cost.label}</span>
                          <span className="font-medium text-black">
                            {cost.amount > 0
                              ? traderForm.currency === "IDR"
                                ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(cost.amount)
                                : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(cost.amount)
                              : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#333]">Tidak ada biaya yang ditanggung pembeli di bawah Incoterm ini.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-[4px] border border-dashed border-black bg-brand-muted/30 text-center">
                <p className="text-sm text-[#333]">
                  Masukkan nilai di atas untuk melihat hasil.
                </p>
              </div>
            )}
          </div>

          {traderError && (
            <div className="flex items-center gap-2 p-3 rounded-[4px] border border-red-200 bg-red-50 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {traderError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button onClick={handleSaveScenario} disabled={saving}>
              {saving ? <Spinner className="w-4 h-4" /> : <DollarSign className="w-4 h-4 mr-1" />}
              Simpan Scenario
            </Button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 w-[380px]">
            <div className="flex items-center gap-2 p-3 rounded-[4px] bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm">{toast.message}</span>
              <button className="ml-auto text-emerald-600 hover:text-emerald-800" onClick={() => setToast(null)}>
                <DollarSign className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
