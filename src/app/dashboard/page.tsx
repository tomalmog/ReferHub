"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
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
          <CardContent className="text-muted-foreground">No active matches</CardContent>
        </Card>
        <Card className="transition hover:shadow-sm hover:border-foreground/20">
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">—</CardContent>
        </Card>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button size="lg">Post an Ask</Button>
        <Button size="lg" variant="secondary">
          Offer a Referral (Give)
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={async () => {
            const res = await fetch("/api/credits", { method: "POST" });
            if (res.ok) {
              // Refresh counts
              (window as any).dispatchEvent(new Event("credits:refresh"));
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
    <div className="text-sm">
      <div>Available: {data.available}</div>
      <div>Escrowed: {data.escrowed}</div>
      <div>Spent: {data.spent}</div>
      <div>Returned: {data.returned}</div>
    </div>
  );
}


