import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const profile = await prisma.profile.upsert({
      where: { email: session.user.email },
      update: { name: session.user.name ?? undefined, image: session.user.image ?? undefined },
      create: { email: session.user.email, name: session.user.name ?? null, image: session.user.image ?? null },
    });
    const listings = await prisma.listing.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    return new Response(JSON.stringify(listings), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const profile = await prisma.profile.upsert({
      where: { email: session.user.email },
      update: { name: session.user.name ?? undefined, image: session.user.image ?? undefined },
      create: { email: session.user.email, name: session.user.name ?? null, image: session.user.image ?? null },
    });
    const body = await req.json().catch(() => ({}));
    const { type, role, level, targetCompanyName, notes } = body ?? {};
    if (type !== "ASK" && type !== "GIVE") {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const created = await prisma.listing.create({
      data: {
        profileId: profile.id,
        type,
        role: role ?? null,
        level: level ?? null,
        targetCompanyName: targetCompanyName ?? null,
        notes: notes ?? null,
      },
    });
    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}


