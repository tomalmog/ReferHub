"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Listing = {
  id: string;
  type: "ASK" | "GIVE";
  role?: string | null;
  level?: string | null;
  targetCompanyName?: string | null;
  createdAt: string;
  profile?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    completionRate: number;
    totalMatches: number;
    successfulMatches: number;
  };
};

export default function ExplorePage() {
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [selectedMyListingId, setSelectedMyListingId] = useState<string>("");
  const [publicListings, setPublicListings] = useState<Listing[]>([]);
  const [existingPairs, setExistingPairs] = useState<Set<string>>(new Set());
  const mySelected = useMemo(
    () => myListings.find((l) => l.id === selectedMyListingId),
    [myListings, selectedMyListingId]
  );

  const visibleListings = useMemo(() => {
    if (!mySelected?.type) return publicListings;
    const opposite = mySelected.type === "ASK" ? "GIVE" : "ASK";
    const filtered = publicListings.filter((l) => l.type === opposite);
    return filtered.length ? filtered : publicListings;
  }, [publicListings, mySelected?.type]);

  useEffect(() => {
    (async () => {
      const mine = await fetch("/api/listings", { cache: "no-store" });
      if (mine.ok) setMyListings(await mine.json());
      const all = await fetch(`/api/listings/public`, { cache: "no-store" });
      if (all.ok) setPublicListings(await all.json());
      const matches = await fetch("/api/matches", { cache: "no-store" });
      if (matches.ok) {
        const list = await matches.json();
        // Normalize to ask|give ids
        const s = new Set<string>(list.map((m: any) => `${m.askListingId}|${m.giveListingId}`));
        setExistingPairs(s);
      }
    })();
  }, []);

  async function requestMatch(targetId: string) {
    if (!selectedMyListingId) {
      toast.error("Select one of your listings first");
      return;
    }
    const my = mySelected;
    const target = publicListings.find((l) => l.id === targetId);
    if (!my || !target) return;
    const askId = my.type === "ASK" ? my.id : target.id;
    const giveId = my.type === "GIVE" ? my.id : target.id;
    const key = `${askId}|${giveId}`;
    if (existingPairs.has(key)) {
      toast.error("Match already requested");
      return;
    }
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ myListingId: selectedMyListingId, targetListingId: targetId }),
    });
    if (res.ok) {
      toast.success("Match requested");
      setExistingPairs((prev) => new Set([...prev, key]));
    } else {
      const j = await res.json().catch(() => ({}));
      if (res.status === 402) {
        toast.error("You need an available credit. Grant one on Dashboard.");
      } else {
        toast.error(j?.error ?? "Failed to create match");
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Explore Listings</h1>
      <p className="mt-2 text-muted-foreground">Pick one of your listings and request a match with someone else.</p>

      <div className="mt-6 max-w-md">
        <label className="mb-2 block text-sm font-medium">Your listing</label>
        <Select value={selectedMyListingId} onValueChange={setSelectedMyListingId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select one" />
          </SelectTrigger>
          <SelectContent>
            {myListings.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.type} • {l.role || "Unspecified"} {l.level ? `• ${l.level}` : ""} {l.targetCompanyName ? `• ${l.targetCompanyName}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleListings.map((l) => (
          <Card key={l.id} className="transition hover:shadow-sm hover:border-foreground/20">
            <CardHeader>
              <CardTitle className="text-base">{l.type} • {l.role || "Unspecified"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {l.level ? `${l.level} • ` : ""}
                {l.targetCompanyName ?? "Any company"}
              </div>

              {/* Show completion rate for GIVE listings */}
              {l.type === "GIVE" && l.profile && l.profile.totalMatches > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={l.profile.completionRate >= 80 ? "default" : l.profile.completionRate >= 50 ? "secondary" : "destructive"}>
                    {l.profile.completionRate.toFixed(0)}% completion
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({l.profile.successfulMatches}/{l.profile.totalMatches})
                  </span>
                </div>
              )}

              {l.type === "GIVE" && l.profile && l.profile.totalMatches === 0 && (
                <div className="mt-3">
                  <Badge variant="outline">New referrer</Badge>
                </div>
              )}

              <Button
                className="mt-4"
                size="sm"
                onClick={() => requestMatch(l.id)}
                disabled={
                  !mySelected || existingPairs.has(
                    `${mySelected.type === "ASK" ? mySelected.id : l.id}|${mySelected?.type === "GIVE" ? mySelected.id : l.id}`
                  )
                }
              >
                {!mySelected
                  ? "Select your listing"
                  : existingPairs.has(
                      `${mySelected.type === "ASK" ? mySelected.id : l.id}|${mySelected.type === "GIVE" ? mySelected.id : l.id}`
                    )
                  ? "Requested"
                  : "Request match"}
              </Button>
            </CardContent>
          </Card>
        ))}
        {visibleListings.length === 0 ? <p className="text-muted-foreground">No listings yet.</p> : null}
      </div>
    </div>
  );
}


