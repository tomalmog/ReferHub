"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Update your profile to improve matching. (Auth and persistence coming next.)
      </p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Company</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Meta" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Role</label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. SWE Intern" />
            </div>
            <div className="pt-2">
              <Button>Save changes</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


