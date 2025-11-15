import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const { id } = await params;
    const me = await prisma.profile.findUnique({ where: { email: session.user.email } });
    if (!me) return new Response("Unauthorized", { status: 401 });
    const m = await prisma.match.findUnique({ where: { id }, include: { ask: true, give: true } });
    if (!m) return new Response("Not found", { status: 404 });
    // Only the giver needs to accept for MVP
    if (m.give.profileId !== me.id) return new Response("Forbidden", { status: 403 });
    if (m.status !== "PENDING") return new Response(null, { status: 204 });
    await prisma.match.update({ where: { id }, data: { status: "ACCEPTED" } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}


