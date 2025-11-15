"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

type Listing = {
  id: string;
  type: "ASK" | "GIVE";
  role?: string | null;
  level?: string | null;
  targetCompanyName?: string | null;
  notes?: string | null;
  createdAt: string;
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [type, setType] = useState<"ASK" | "GIVE">("ASK");
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/listings", { cache: "no-store" });
      if (res.status === 401) {
        const cb = encodeURIComponent("/listings");
        window.location.href = `/login?callbackUrl=${cb}`;
        return;
      }
      if (res.ok) setListings(await res.json());
      else {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.error ?? "Failed to load listings");
      }
    })();
  }, []);

  async function createListing() {
    setLoading(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, role, level, targetCompanyName: company, notes }),
      });
      if (res.ok) {
        const created = await res.json();
        setListings((l) => [created, ...l]);
        setRole("");
        setLevel("");
        setCompany("");
        setNotes("");
        toast.success("Listing created");
      } else {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.error ?? "Failed to create listing");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Your Listings</h1>
      <p className="mt-2 text-muted-foreground">Create an Ask or a Give to start matching.</p>

      <Card className="mt-8 transition hover:shadow-sm hover:border-foreground/20">
        <CardHeader>
          <CardTitle>New Listing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASK">Ask</SelectItem>
                  <SelectItem value="GIVE">Give</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Target company (optional)</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Role (optional)</label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. SWE Intern" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Level (optional)</label>
              <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. New Grad" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium">Notes (optional)</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything helpful" />
            </div>
          </div>
          <Button onClick={createListing} disabled={loading}>
            {loading ? "Creating…" : "Create listing"}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4">
        {listings.map((l) => (
          <Card key={l.id} className="transition hover:shadow-sm hover:border-foreground/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm uppercase text-muted-foreground">{l.type}</div>
                <div className="flex items-center gap-3">
                  <ConfirmDeleteDialog
                    onConfirm={async () => {
                      const res = await fetch(`/api/listings/${l.id}`, { method: "DELETE" });
                      if (res.status === 204) {
                        setListings((ls) => ls.filter((x) => x.id !== l.id));
                        toast.success("Listing deleted");
                      } else {
                        const j = await res.json().catch(() => ({}));
                        toast.error(j?.error ?? "Failed to delete");
                      }
                    }}
                  />
                  <div className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-2 font-medium">
                {l.role || "Unspecified role"} {l.level ? `• ${l.level}` : ""}
                {l.targetCompanyName ? ` • ${l.targetCompanyName}` : ""}
              </div>
              {l.notes ? <div className="mt-1 text-sm text-muted-foreground">{l.notes}</div> : null}
            </CardContent>
          </Card>
        ))}
        {listings.length === 0 ? (
          <p className="text-muted-foreground">No listings yet.</p>
        ) : null}
      </div>
    </div>
  );
}


