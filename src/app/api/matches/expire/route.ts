import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/matches/expire
 * Check and expire matches that have passed their deadlines
 * This endpoint can be called by a cron job (e.g., Vercel Cron)
 *
 * Returns escrowed credits to askers when matches expire
 */
export async function POST(request: Request) {
  try {
    // Optional: Add auth check for cron job security
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const now = new Date();

    // Find matches that are PENDING and past acknowledgeBy deadline
    const pendingExpired = await prisma.match.findMany({
      where: {
        status: 'PENDING',
        acknowledgeBy: {
          lt: now,
        },
      },
      include: {
        ask: { include: { profile: true } },
        give: { include: { profile: true } },
      },
    });

    // Find matches that are ACCEPTED but past submitBy deadline
    const acceptedExpired = await prisma.match.findMany({
      where: {
        status: 'ACCEPTED',
        submitBy: {
          lt: now,
        },
        // Only expire if no approved proof exists
        proofs: {
          none: {
            status: 'APPROVED',
          },
        },
      },
      include: {
        ask: { include: { profile: true } },
        give: { include: { profile: true } },
      },
    });

    const expiredMatches = [...pendingExpired, ...acceptedExpired];
    const expiredCount = expiredMatches.length;

    // Expire matches and return escrowed credits
    for (const match of expiredMatches) {
      await prisma.$transaction(async (tx: any) => {
        // Update match status to EXPIRED
        await tx.match.update({
          where: { id: match.id },
          data: { status: 'EXPIRED' },
        });

        // Return escrowed credit to asker
        if (match.escrowCreditId) {
          await tx.credit.update({
            where: { id: match.escrowCreditId },
            data: { status: 'RETURNED' },
          });

          // Grant a new available credit to replace the returned one
          await tx.credit.create({
            data: {
              profileId: match.ask.profileId,
              status: 'AVAILABLE',
              source: 'GRANT',
            },
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      expiredCount,
      matches: expiredMatches.map(m => ({
        id: m.id,
        status: m.status,
        acknowledgeBy: m.acknowledgeBy,
        submitBy: m.submitBy,
      })),
    });
  } catch (error) {
    console.error('Expire matches error:', error);
    return NextResponse.json(
      { error: 'Failed to expire matches' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matches/expire
 * Preview matches that would be expired (without actually expiring them)
 */
export async function GET() {
  try {
    const now = new Date();

    const pendingExpired = await prisma.match.findMany({
      where: {
        status: 'PENDING',
        acknowledgeBy: {
          lt: now,
        },
      },
      select: {
        id: true,
        status: true,
        acknowledgeBy: true,
        submitBy: true,
        createdAt: true,
      },
    });

    const acceptedExpired = await prisma.match.findMany({
      where: {
        status: 'ACCEPTED',
        submitBy: {
          lt: now,
        },
        proofs: {
          none: {
            status: 'APPROVED',
          },
        },
      },
      select: {
        id: true,
        status: true,
        acknowledgeBy: true,
        submitBy: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      pendingExpired,
      acceptedExpired,
      total: pendingExpired.length + acceptedExpired.length,
    });
  } catch (error) {
    console.error('Get expired matches error:', error);
    return NextResponse.json(
      { error: 'Failed to get expired matches' },
      { status: 500 }
    );
  }
}
