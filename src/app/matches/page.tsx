"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Match = {
  id: string;
  status: "PENDING" | "ACCEPTED";
  ask: { id: string; type: "ASK" | "GIVE"; role?: string | null; targetCompanyName?: string | null };
  give: { id: string; type: "ASK" | "GIVE"; role?: string | null; targetCompanyName?: string | null };
  hasNewMessage?: boolean;
  lastMessage?: { id: string; senderProfileId: string; body: string; createdAt: string } | null;
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/matches", { cache: "no-store" });
      if (res.ok) setMatches(await res.json());
    })();
  }, []);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Matches</h1>
      <div className="mt-8 grid gap-4">
        {matches.map((m) => (
          <Link key={m.id} href={`/matches/${m.id}`}>
            <Card className="transition hover:shadow-sm hover:border-foreground/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">{m.status}</div>
                    {m.hasNewMessage ? <Badge>New</Badge> : null}
                  </div>
                  <div className="text-sm">Chat →</div>
                </div>
                <div className="mt-1 text-sm">
                  Ask: {m.ask.role ?? "Unspecified"} • {m.ask.targetCompanyName ?? "Any"}
                </div>
                <div className="text-sm">
                  Give: {m.give.role ?? "Unspecified"} • {m.give.targetCompanyName ?? "Any"}
                </div>
                {m.lastMessage ? (
                  <div className="mt-2 truncate text-sm text-muted-foreground">Last: {m.lastMessage.body}</div>
                ) : null}
              </CardContent>
            </Card>
          </Link>
        ))}
        {matches.length === 0 ? <p className="text-muted-foreground">No matches yet.</p> : null}
      </div>
    </div>
  );
}


