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

    // When accepting, update submitBy to 7 days from now and increment totalMatches
    const submitBy = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx: any) => {
      // Update match
      await tx.match.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          submitBy,
        }
      });

      // Increment giver's totalMatches
      await tx.profile.update({
        where: { id: me.id },
        data: {
          totalMatches: {
            increment: 1,
          },
        },
      });

      // Recalculate completion rate (in case it changed)
      const updatedProfile = await tx.profile.findUnique({ where: { id: me.id } });
      if (updatedProfile && updatedProfile.totalMatches > 0) {
        const newCompletionRate = (updatedProfile.successfulMatches / updatedProfile.totalMatches) * 100;
        await tx.profile.update({
          where: { id: me.id },
          data: {
            completionRate: newCompletionRate,
          },
        });
      }
    });

    return new Response(null, { status: 204 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}


