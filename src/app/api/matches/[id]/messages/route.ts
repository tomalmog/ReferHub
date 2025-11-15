import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertMember(matchId: string, email: string) {
  const me = await prisma.profile.findUnique({ where: { email } });
  if (!me) return null;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { ask: true, give: true },
  });
  if (!match) return null;
  const isMember = match.ask.profileId === me.id || match.give.profileId === me.id;
  return isMember ? { me, match } : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const { id } = await params;
    const authz = await assertMember(id, session.user.email);
    if (!authz) return new Response("Not found", { status: 404 });
    const messages = await prisma.message.findMany({
      where: { matchId: id },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    return new Response(JSON.stringify(messages), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const { id } = await params;
    const authz = await assertMember(id, session.user.email);
    if (!authz) return new Response("Not found", { status: 404 });
    const body = await req.json().catch(() => ({}));
    if (!body?.body || typeof body.body !== "string") return new Response(JSON.stringify({ error: "Missing body" }), { status: 400, headers: { "content-type": "application/json" } });
    const created = await prisma.message.create({
      data: { matchId: id, senderProfileId: authz.me.id, body: body.body },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    return new Response(JSON.stringify(created), { status: 201, headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}


