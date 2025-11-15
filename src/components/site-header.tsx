"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated" && !!session?.user;
  const pathname = usePathname();
  const isActive = (href: string) => (pathname === href || pathname?.startsWith(href + "/"));
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            ReferHub
          </Link>
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
            <Link href="/features" className={`rounded-md px-2 py-1 transition hover:text-foreground ${isActive("/features") ? "bg-muted text-foreground" : ""}`}>
              Features
            </Link>
            <Link href="/how-it-works" className={`rounded-md px-2 py-1 transition hover:text-foreground ${isActive("/how-it-works") ? "bg-muted text-foreground" : ""}`}>
              How it works
            </Link>
            <Link href="/listings" className={`rounded-md px-2 py-1 transition hover:text-foreground ${isActive("/listings") ? "bg-muted text-foreground" : ""}`}>
              Listings
            </Link>
            <Link href="/explore" className={`rounded-md px-2 py-1 transition hover:text-foreground ${isActive("/explore") ? "bg-muted text-foreground" : ""}`}>
              Explore
            </Link>
            <Link href="/dashboard" className={`rounded-md px-2 py-1 transition hover:text-foreground ${isActive("/dashboard") ? "bg-muted text-foreground" : ""}`}>
              Dashboard
            </Link>
            <Link href="/matches" className={`rounded-md px-2 py-1 transition hover:text-foreground ${isActive("/matches") ? "bg-muted text-foreground" : ""}`}>
              Matches
            </Link>
          </nav>
        </div>
        {isAuthed ? (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-2">
                  <Avatar className="size-6">
                    <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? ""} />
                    <AvatarFallback>
                      {(session.user?.name ?? "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="truncate text-sm font-medium">{session.user?.name ?? "Account"}</div>
                  <div className="truncate text-xs text-muted-foreground">{session.user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/listings">Your listings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}


