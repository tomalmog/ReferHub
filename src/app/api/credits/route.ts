import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
  const me = await prisma.profile.findUnique({ where: { email: session.user.email } });
  if (!me) return new Response(JSON.stringify({ available: 0 }), { status: 200, headers: { "content-type": "application/json" } });
  const [available, escrowed, spent, returned] = await Promise.all([
    prisma.credit.count({ where: { profileId: me.id, status: "AVAILABLE" } }),
    prisma.credit.count({ where: { profileId: me.id, status: "ESCROWED" } }),
    prisma.credit.count({ where: { profileId: me.id, status: "SPENT" } }),
    prisma.credit.count({ where: { profileId: me.id, status: "RETURNED" } }),
  ]);
  return new Response(
    JSON.stringify({ available, escrowed, spent, returned }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

// Dev convenience: grant one available credit
export async function POST() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
  const me = await prisma.profile.upsert({ where: { email: session.user.email }, update: {}, create: { email: session.user.email } });
  const created = await prisma.credit.create({ data: { profileId: me.id, source: "GRANT", status: "AVAILABLE" } });
  return new Response(JSON.stringify(created), { status: 201, headers: { "content-type": "application/json" } });
}


