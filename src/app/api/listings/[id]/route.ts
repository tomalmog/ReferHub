import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnerProfileId(email: string) {
  const profile = await prisma.profile.upsert({
    where: { email },
    update: {},
    create: { email },
  });
  return profile.id;
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return new Response("Missing id", { status: 400 });
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const ownerId = await getOwnerProfileId(session.user.email);
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.profileId !== ownerId) return new Response("Not found", { status: 404 });
    await prisma.listing.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return new Response("Missing id", { status: 400 });
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const ownerId = await getOwnerProfileId(session.user.email);
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.profileId !== ownerId) return new Response("Not found", { status: 404 });
    const body = await req.json().catch(() => ({} as any));
    const data: any = {};
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.role === "string") data.role = body.role || null;
    if (typeof body.level === "string") data.level = body.level || null;
    if (typeof body.targetCompanyName === "string") data.targetCompanyName = body.targetCompanyName || null;
    if (typeof body.notes === "string") data.notes = body.notes || null;
    const updated = await prisma.listing.update({ where: { id }, data });
    return new Response(JSON.stringify(updated), {
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


