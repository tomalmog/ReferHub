import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const { id } = await params;
    const me = await prisma.profile.findUnique({ where: { email: session.user.email } });
    if (!me) return new Response("Unauthorized", { status: 401 });
    const m = await prisma.match.findUnique({
      where: { id },
      include: {
        ask: true,
        give: true,
        escrowCredit: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!m) return new Response("Not found", { status: 404 });
    const isMember = m.ask.profileId === me.id || m.give.profileId === me.id;
    if (!isMember) return new Response("Not found", { status: 404 });
    const isGiver = m.give.profileId === me.id;
    return new Response(JSON.stringify({ ...m, isGiver, currentUserProfileId: me.id }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}


