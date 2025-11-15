"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<{
    activeMatches: number;
    completionRate: number;
    totalMatches: number;
  } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [profileRes, matchesRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/matches"),
      ]);

      if (profileRes.ok && matchesRes.ok) {
        const profile = await profileRes.json();
        const matches = await matchesRes.json();

        const activeMatches = matches.filter(
          (m: any) => m.status === "PENDING" || m.status === "ACCEPTED"
        ).length;

        setStats({
          activeMatches,
          completionRate: profile.completionRate,
          totalMatches: profile.totalMatches,
        });
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Post an Ask/Give, track matches, and manage your referrals.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition hover:shadow-sm hover:border-foreground/20">
          <CardHeader>
            <CardTitle>Your Credits</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <CreditsSummary />
          </CardContent>
        </Card>
        <Card className="transition hover:shadow-sm hover:border-foreground/20">
          <CardHeader>
            <CardTitle>Active Matches</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-3xl font-semibold">{stats.activeMatches}</div>
            ) : (
              <span className="text-muted-foreground">Loading...</span>
            )}
          </CardContent>
        </Card>
        <Card className="transition hover:shadow-sm hover:border-foreground/20">
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div>
                <div className="text-3xl font-semibold">
                  {stats.totalMatches > 0 ? `${stats.completionRate.toFixed(0)}%` : "—"}
                </div>
                {stats.totalMatches > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Based on {stats.totalMatches} match{stats.totalMatches !== 1 ? "es" : ""}
                  </p>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Loading...</span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button size="lg" onClick={() => router.push("/listings")}>
          Manage Listings
        </Button>
        <Button size="lg" variant="secondary" onClick={() => router.push("/explore")}>
          Explore Matches
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={async () => {
            const res = await fetch("/api/credits", { method: "POST" });
            if (res.ok) {
              // Refresh counts
              (window as any).dispatchEvent(new Event("credits:refresh"));
              loadStats();
            }
          }}
        >
          Grant dev credit
        </Button>
      </div>
    </div>
  );
}

function CreditsSummary() {
  const [data, setData] = useState<{ available: number; escrowed: number; spent: number; returned: number } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/credits", { cache: "no-store" });
        if (res.status === 401) {
          window.location.href = "/login?callbackUrl=" + encodeURIComponent("/dashboard");
          return;
        }
        if (res.ok) {
          setData(await res.json());
        } else {
          setData({ available: 0, escrowed: 0, spent: 0, returned: 0 });
        }
      } catch {
        setData({ available: 0, escrowed: 0, spent: 0, returned: 0 });
      }
    })();
  }, []);
  useEffect(() => {
    const handler = () => {
      fetch("/api/credits", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setData(j))
        .catch(() => {});
    };
    window.addEventListener("credits:refresh", handler);
    return () => window.removeEventListener("credits:refresh", handler);
  }, []);
  if (!data) return <span className="text-muted-foreground">Loading…</span>;
  return (
    <div className="text-sm space-y-1">
      <div className="flex justify-between">
        <span>Available:</span>
        <span className="font-semibold">{data.available}</span>
      </div>
      <div className="flex justify-between">
        <span>Escrowed:</span>
        <span className="font-semibold">{data.escrowed}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Spent:</span>
        <span>{data.spent}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Returned:</span>
        <span>{data.returned}</span>
      </div>
    </div>
  );
}
