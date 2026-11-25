"use client";

import { useState } from "react";
import { RotateCcw, Settings as SettingsIcon } from "lucide-react";
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
import { useCommissionDistribution, useDemoStore } from "@/lib/firebase-store";


type DistributionDraft = {
  partnerAShare: number;
  partnerBShare: number;
  operationalReserve: number;
};

const APP_NAME = "Harsa Reka Niaga";
const APP_BRAND = "Export Business Workspace";
const APP_VERSION = "v0.1.0";

export default function SettingsPage() {
  const { reset } = useDemoStore();
  const { value: distribution, update, refresh } = useCommissionDistribution();
  const [draft, setDraft] = useState<DistributionDraft>({
    partnerAShare: distribution.partnerAShare,
    partnerBShare: distribution.partnerBShare,
    operationalReserve: distribution.operationalReserve,
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

  const total = draft.partnerAShare + draft.partnerBShare + draft.operationalReserve;
  const isValid =
    Object.values(draft).every((value) => Number.isFinite(value) && value >= 0) &&
    Math.abs(total - 100) < 0.0001;

  const showToast = (message: string, error = false) => {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 2500);
  };

  const saveDistribution = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      showToast("The distribution shares must add up to 100%.", true);
      return;
    }
    update(draft);
    refresh();
    showToast("Commission distribution saved.");
  };

  const resetData = () => {
    reset();
    setDraft({
      partnerAShare: 40,
      partnerBShare: 40,
      operationalReserve: 20,
    });
    setResetDialogOpen(false);
    showToast("Demo data has been reset.");
  };

  const updateShare = (field: keyof DistributionDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      [field]: value === "" ? 0 : Number(value),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-brand-forest text-white">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">Settings</h1>
            <p className="mt-1 text-sm text-[#333]">Manage workspace preferences.</p>
          </div>
        </div>      </div>

      <Card className="border-black">
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-semibold text-black">Data</h2>
            <p className="mt-1 text-sm text-[#333]">
              Restore the workspace to its original sample records.
            </p>
          </div>
          <Button variant="outline" onClick={() => setResetDialogOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Data
          </Button>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-semibold text-black">Commission Distribution</h2>
            <p className="mt-1 text-sm text-[#333]">
              Allocate commission revenue between partners and operational reserve.
            </p>
          </div>
          <form onSubmit={saveDistribution} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="partner-a-share">Partner A (%)</Label>
                <Input id="partner-a-share" type="number" min="0" max="100" step="any" value={draft.partnerAShare} onChange={(event) => updateShare("partnerAShare", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-b-share">Partner B (%)</Label>
                <Input id="partner-b-share" type="number" min="0" max="100" step="any" value={draft.partnerBShare} onChange={(event) => updateShare("partnerBShare", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reserve-share">Operational reserve (%)</Label>
                <Input id="reserve-share" type="number" min="0" max="100" step="any" value={draft.operationalReserve} onChange={(event) => updateShare("operationalReserve", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-sm font-medium ${isValid ? "text-emerald-700" : "text-red-700"}`}>
                Total: {total}% {isValid ? "· balanced" : "· must equal 100%"}
              </p>
              <Button type="submit" disabled={!isValid}>Save distribution</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-semibold text-black">App Info</h2>
            <p className="mt-1 text-sm text-[#333]">Workspace identity and release information.</p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[#333]">App name</dt>
              <dd className="mt-1 font-medium text-brand-foreground">{APP_NAME}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#333]">Brand</dt>
              <dd className="mt-1 font-medium text-brand-foreground">{APP_BRAND}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#333]">Version</dt>
              <dd className="mt-1 font-medium text-brand-foreground">{APP_VERSION}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-red-700">
              Reset data?
            </DialogTitle>
            <DialogDescription>
              This replaces current local records with the original sample data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-black px-6 py-4 sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={resetData}>Reset Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-[4px] border px-4 py-3 shadow-lg ${toast.error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          <span className="text-sm">{toast.message}</span>
          <button type="button" className="text-xs font-medium" onClick={() => setToast(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
