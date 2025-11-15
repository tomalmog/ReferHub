"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderProfileId: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

type Proof = {
  id: string;
  fileUrl: string;
  description: string | null;
  status: string;
  createdAt: string;
  submittedBy: { id: string; name: string | null; email: string };
};

export default function MatchChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [status, setStatus] = useState<string>("PENDING");
  const [escrowed, setEscrowed] = useState<boolean>(false);
  const [isGiver, setIsGiver] = useState<boolean>(false);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string>("");
  const [body, setBody] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [proofDescription, setProofDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const info = await fetch(`/api/matches/${id}`, { cache: "no-store" });
    if (info.ok) {
      const m = await info.json();
      setStatus(m.status);
      setEscrowed(!!m.escrowCreditId);
      setIsGiver(m.isGiver || false);
      setCurrentUserProfileId(m.currentUserProfileId || "");
    }
    const res = await fetch(`/api/matches/${id}/messages`, { cache: "no-store" });
    if (res.ok) setMessages(await res.json());

    // Fetch proofs
    const proofsRes = await fetch(`/api/matches/${id}/proofs`, { cache: "no-store" });
    if (proofsRes.ok) setProofs(await proofsRes.json());
  }

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function send() {
    if (!body.trim()) return;
    const res = await fetch(`/api/matches/${id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      const m = await res.json();
      setMessages((arr) => [...arr, m]);
      setBody("");
    }
  }

  async function acceptMatch() {
    const res = await fetch(`/api/matches/${id}/accept`, { method: "POST" });
    if (res.status === 204) {
      toast.success("Match accepted!");
      setStatus("ACCEPTED");
    } else {
      toast.error("Failed to accept match");
    }
  }

  async function declineMatch() {
    const res = await fetch(`/api/matches/${id}/decline`, { method: "POST" });
    if (res.ok) {
      toast.success("Match declined");
      router.push("/matches");
    } else {
      toast.error("Failed to decline match");
    }
  }

  async function submitProof() {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        toast.error(error.error || "Failed to upload file");
        return;
      }

      const { url } = await uploadRes.json();

      // Create proof record
      const proofRes = await fetch(`/api/matches/${id}/proofs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileUrl: url, description: proofDescription }),
      });

      if (!proofRes.ok) {
        const error = await proofRes.json();
        toast.error(error.error || "Failed to submit proof");
        return;
      }

      const proof = await proofRes.json();
      setProofs((arr) => [proof, ...arr]);
      setSelectedFile(null);
      setProofDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Proof submitted successfully");
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Match chat</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{status}</Badge>
          {escrowed ? <Badge>Escrowed</Badge> : null}
        </div>
      </div>

      {/* Accept/Decline buttons for pending matches (giver only) */}
      {status === "PENDING" && isGiver && (
        <Card className="mt-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-medium text-amber-900 dark:text-amber-100">Incoming Match Request</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Someone wants you to refer them. Accept to start chatting.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={declineMatch} size="sm">
                  Decline
                </Button>
                <Button onClick={acceptMatch} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Accept
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Proof Section */}
      {status === "ACCEPTED" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Referral Proof</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Submit proof form (only for giver) */}
            {isGiver && (
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-medium text-sm">Submit Proof of Referral</h3>
                <div className="space-y-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <Textarea
                    placeholder="Optional notes about the referral..."
                    value={proofDescription}
                    onChange={(e) => setProofDescription(e.target.value)}
                    rows={2}
                  />
                  <Button onClick={submitProof} disabled={!selectedFile || uploading} size="sm">
                    {uploading ? "Uploading..." : "Submit Proof"}
                  </Button>
                </div>
              </div>
            )}

            {/* Display existing proofs */}
            {proofs.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Submitted Proofs</h3>
                {proofs.map((proof) => (
                  <div key={proof.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{proof.submittedBy.name || proof.submittedBy.email}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          {new Date(proof.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant={proof.status === "APPROVED" ? "default" : "secondary"}>
                        {proof.status}
                      </Badge>
                    </div>
                    {proof.description && (
                      <p className="text-sm text-muted-foreground">{proof.description}</p>
                    )}
                    <a
                      href={proof.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      View proof file →
                    </a>
                  </div>
                ))}
              </div>
            )}

            {proofs.length === 0 && !isGiver && (
              <p className="text-sm text-muted-foreground">No proof submitted yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chat Section */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div ref={listRef} className="max-h-[50vh] overflow-auto space-y-3 px-2">
            {messages.map((m) => {
              const isMe = m.senderProfileId === currentUserProfileId;
              const senderName = m.sender.name || m.sender.email.split('@')[0];

              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                    <div className="text-xs text-muted-foreground mb-1 px-1">
                      {isMe ? "You" : senderName}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-bl-none"
                      }`}
                    >
                      <div className="text-sm">{m.body}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && status === "ACCEPTED" ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No messages yet. Start the conversation!
              </p>
            ) : null}
            {status === "PENDING" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  {isGiver
                    ? "Accept the match request above to start chatting."
                    : "Waiting for the other person to accept your match request..."}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-start gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={status === "PENDING" ? "Accept match to send messages..." : "Write a message..."}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && status === "ACCEPTED") {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              disabled={status === "PENDING"}
            />
            <Button onClick={send} disabled={!body.trim() || status === "PENDING"}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
