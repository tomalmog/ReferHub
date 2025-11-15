import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const me = await prisma.profile.findUnique({ where: { email: session.user.email } });
    if (!me) return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ ask: { profileId: me.id } }, { give: { profileId: me.id } }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        ask: true,
        give: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, senderProfileId: true, body: true, createdAt: true } },
      },
    });
    const shaped = matches.map((m: any) => {
      const last = m.messages?.[0] ?? null;
      const hasNewMessage = last ? last.senderProfileId !== me.id : false;
      return { ...m, lastMessage: last, hasNewMessage };
    });
    return new Response(JSON.stringify(shaped), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const me = await prisma.profile.findUnique({ where: { email: session.user.email } });
    if (!me) return new Response("Unauthorized", { status: 401 });
    const { myListingId, targetListingId } = await req.json();
    if (!myListingId || !targetListingId) {
      return new Response(JSON.stringify({ error: "Missing listing ids" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    const myListing = await prisma.listing.findUnique({ where: { id: myListingId } });
    const targetListing = await prisma.listing.findUnique({ where: { id: targetListingId } });
    if (!myListing || !targetListing) return new Response(JSON.stringify({ error: "Listing not found" }), { status: 404, headers: { "content-type": "application/json" } });
    if (myListing.profileId !== me.id) return new Response(JSON.stringify({ error: "Not your listing" }), { status: 403, headers: { "content-type": "application/json" } });
    if (targetListing.profileId === me.id) return new Response(JSON.stringify({ error: "Cannot match with your own listing" }), { status: 400, headers: { "content-type": "application/json" } });
    if (myListing.type === targetListing.type) return new Response(JSON.stringify({ error: "Listings must be opposite types" }), { status: 400, headers: { "content-type": "application/json" } });
    const askId = myListing.type === "ASK" ? myListing.id : targetListing.id;
    const giveId = myListing.type === "GIVE" ? myListing.id : targetListing.id;
    const existing = await prisma.match.findFirst({ where: { askListingId: askId, giveListingId: giveId } });
    if (existing) {
      return new Response(JSON.stringify({ error: "Match already exists" }), { status: 409, headers: { "content-type": "application/json" } });
    }
    // Escrow one available credit from the ASK owner and set deadlines
    const created = await prisma.$transaction(async (tx: any) => {
      const askOwner = await tx.listing.findUnique({ where: { id: askId } }).then((l: any) => l?.profileId);
      if (!askOwner) throw new Error("Ask owner not found");
      const credit = await tx.credit.findFirst({ where: { profileId: askOwner, status: "AVAILABLE" } });
      if (!credit) {
        throw Object.assign(new Error("Insufficient credits"), { httpStatus: 402 });
      }

      // Calculate deadlines
      const now = new Date();
      const acknowledgeBy = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
      const submitBy = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000); // 9 days from now (2 days to accept + 7 days to submit)

      const match = await tx.match.create({
        data: {
          askListingId: askId,
          giveListingId: giveId,
          acknowledgeBy,
          submitBy,
        }
      });
      await tx.credit.update({ where: { id: credit.id }, data: { status: "ESCROWED" } });
      await tx.match.update({ where: { id: match.id }, data: { escrowCreditId: credit.id } });
      return await tx.match.findUnique({ where: { id: match.id }, include: { ask: true, give: true } });
    });
    return new Response(JSON.stringify(created), { status: 201, headers: { "content-type": "application/json" } });
  } catch (e) {
    if (typeof e === "object" && e && (e as any).httpStatus === 402) {
      return new Response(JSON.stringify({ error: "You need an available credit to request a match." }), { status: 402, headers: { "content-type": "application/json" } });
    }
    if (typeof e === "object" && e && (e as any).code === "P2002") {
      return new Response(JSON.stringify({ error: "Match already exists" }), { status: 409, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}


