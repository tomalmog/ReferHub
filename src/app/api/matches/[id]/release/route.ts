import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const { id } = await params;
    const match = await prisma.match.findUnique({ where: { id }, include: { ask: true, give: true } });
    if (!match || !match.escrowCreditId) return new Response("Not found", { status: 404 });
    // Spend escrow and award giver
    await prisma.$transaction(async (tx: any) => {
      await tx.credit.update({ where: { id: match.escrowCreditId! }, data: { status: "SPENT" } });
      const giverProfileId = match.give.profileId;
      await tx.credit.create({ data: { profileId: giverProfileId, status: "AVAILABLE", source: "EARNED" } });
      await tx.match.update({ where: { id: match.id }, data: { status: "ACCEPTED" } });
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}


