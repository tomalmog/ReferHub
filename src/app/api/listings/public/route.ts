import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const myEmail = session?.user?.email ?? null;
    const me = myEmail
      ? await prisma.profile.findUnique({ where: { email: myEmail } })
      : null;
    const where: any = { active: true };
    if (type === "ASK" || type === "GIVE") where.type = type;
    if (me) where.profileId = { not: me.id };
    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
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


