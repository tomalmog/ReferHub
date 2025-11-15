import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.company.count();
    return new Response(JSON.stringify({ ok: true, companies: count }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}


