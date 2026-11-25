"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  RotateCcw,
  DollarSign,
  AlertCircle,
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
import { Spinner } from "@/components/ui/spinner";

import { useCalculatorScenarios, useActivityLogs } from "@/lib/firebase-store";
import { v4 as uuid } from "uuid";
import { calcCommission } from "@/lib/calc";
import type { CommissionCalcInput } from "@/lib/calc";

const INITIAL_COMMISSION_FORM: CommissionCalcInput = {
  supplierTransactionValue: 0,
  commissionType: "Percentage of Transaction Value",
  commissionRate: 3,
  quantity: 0,
  currency: "IDR",
};

export default function LocalCalculatorPage() {
  const { add: addScenario, refresh } = useCalculatorScenarios();
  const { add: addActivityLog } = useActivityLogs();

  const [commissionForm, setCommissionForm] = useState(INITIAL_COMMISSION_FORM);
  const [commissionResult, setCommissionResult] = useState<ReturnType<typeof calcCommission> | null>(null);
  const [commissionError, setCommissionError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const commissionInput = useMemo(
    () => ({
      ...commissionForm,
      quantity: commissionForm.quantity || undefined,
    }),
    [commissionForm]
  );

  useEffect(() => {
    setCommissionError(null);
    setCommissionResult(null);
    if (commissionInput.supplierTransactionValue > 0 || (commissionInput.commissionType === "Fee per Ton" && commissionInput.quantity)) {
      try {
        const result = calcCommission(commissionInput);
        setCommissionResult(result);
      } catch (e) {
        setCommissionError(e instanceof Error ? e.message : "Invalid input");
      }
    }
  }, [commissionInput]);

  const handleReset = () => {
    setCommissionForm(INITIAL_COMMISSION_FORM);
    setCommissionResult(null);
    setCommissionError(null);
  };

  const handleSaveScenario = () => {
    setSaving(true);
    try {
      addScenario({
        id: uuid(),
        name: `Agent scenario ${new Date().toISOString().split("T")[0]}`,
        mode: "Commission",
        payload: commissionForm,
        createdAt: new Date().toISOString(),
        demo: true,
      });
      addActivityLog({
        id: uuid(),
        action: "Calculator scenario saved",
        entity: "Calculator",
        entityId: uuid(),
        description: "Agent calculator scenario saved",
        createdAt: new Date().toISOString(),
        demo: true,
      });
      setToast({ message: "Agent scenario saved", type: "success" });
      refresh();
    } catch {
      setToast({ message: "Failed to save scenario", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-[4px] bg-brand-forest text-white">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-black tracking-tight">Local / Agent Calculator</h1>
            <p className="text-sm text-[#333] mt-1">
              Estimate intermediary commission earnings on local transactions.
            </p>
          </div>
        </div>      </div>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={commissionForm.currency}
              onValueChange={(v) => setCommissionForm({ ...commissionForm, currency: v as "IDR" | "USD" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IDR">IDR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplierTransactionValue">Supplier Transaction Value *</Label>
            <Input
              id="supplierTransactionValue"
              type="number"
              min="0"
              step="0.01"
              value={commissionForm.supplierTransactionValue || ""}
              onChange={(e) =>
                setCommissionForm({
                  ...commissionForm,
                  supplierTransactionValue: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="commissionRate">Commission Rate</Label>
            <Input
              id="commissionRate"
              type="number"
              min="0"
              step="0.01"
              value={commissionForm.commissionRate || ""}
              onChange={(e) =>
                setCommissionForm({
                  ...commissionForm,
                  commissionRate: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="3"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity (optional)</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={commissionForm.quantity || ""}
              onChange={(e) =>
                setCommissionForm({
                  ...commissionForm,
                  quantity: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
          </div>
        </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Commission Type</Label>
              <Select
                value={commissionForm.commissionType}
                onValueChange={(v) =>
                  setCommissionForm({
                    ...commissionForm,
                    commissionType: v as "Percentage of Transaction Value" | "Fixed Fee" | "Fee per Ton",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Percentage of Transaction Value">Percentage of Transaction Value</SelectItem>
                  <SelectItem value="Fixed Fee">Fixed Fee</SelectItem>
                  <SelectItem value="Fee per Ton">Fee per Ton</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        <Separator className="border-black" />

        {/* Results */}
        <div className="grid gap-4 sm:grid-cols-2">
          {commissionResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-[4px] border border-black bg-[#fffdf5] shadow-sm">
                <h3 className="text-sm font-semibold text-black mb-3">Results</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-[#333] mb-1">Total Transaction Value</div>
                    <div className="text-lg font-semibold text-black">
                      {commissionForm.currency === "IDR"
                        ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(commissionResult.totalTransactionValue)
                        : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(commissionResult.totalTransactionValue)}
                    </div>
                  </div>
                  {commissionResult.commissionPercentage !== null && (
                    <div>
                      <div className="text-xs text-[#333] mb-1">Commission Percentage</div>
                      <div className="text-sm font-medium text-black">
                        {commissionResult.commissionPercentage}%
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-[#333] mb-1">Estimated Commission</div>
                    <div className="text-lg font-semibold text-black">
                      {commissionForm.currency === "IDR"
                        ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(commissionResult.estimatedCommission)
                        : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(commissionResult.estimatedCommission)}
                    </div>
                  </div>
                  {commissionResult.commissionPerUnit !== null && (
                    <div>
                      <div className="text-xs text-[#333] mb-1">Commission per Unit</div>
                      <div className="text-sm font-medium text-black">
                        {commissionForm.currency === "IDR"
                          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 }).format(commissionResult.commissionPerUnit)
                          : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(commissionResult.commissionPerUnit)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[4px] border border-dashed border-black bg-brand-muted/30 text-center">
              <p className="text-sm text-[#333]">
                Enter values above to see results.
              </p>
            </div>
          )}
        </div>

        {commissionError && (
          <div className="flex items-center gap-2 p-3 rounded-[4px] border border-red-200 bg-red-50 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {commissionError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button onClick={handleSaveScenario} disabled={saving}>
            {saving ? <Spinner className="w-4 h-4" /> : <DollarSign className="w-4 h-4 mr-1" />}
            Save Scenario
          </Button>
        </div>
      </div>

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
  );
}
