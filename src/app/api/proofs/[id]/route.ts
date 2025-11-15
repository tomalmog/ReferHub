import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/proofs/[id]
 * Approve or reject a referral proof (asker only)
 * When approved, also releases the escrow and awards credit to giver
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const proofId = params.id;

    // Get current user's profile
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get the proof with match details
    const proof = await prisma.referralProof.findUnique({
      where: { id: proofId },
      include: {
        match: {
          include: {
            ask: { include: { profile: true } },
            give: { include: { profile: true } },
          },
        },
      },
    });

    if (!proof) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
    }

    // Verify user is the asker (only asker can approve/reject)
    if (proof.match.ask.profileId !== profile.id) {
      return NextResponse.json(
        { error: 'Only the job seeker can approve/reject proof' },
        { status: 403 }
      );
    }

    // Verify proof is in SUBMITTED status
    if (proof.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Proof has already been reviewed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Approve proof and release escrow in a transaction
      await prisma.$transaction(async (tx: any) => {
        // Update proof status
        await tx.referralProof.update({
          where: { id: proofId },
          data: { status: 'APPROVED' },
        });

        const giverProfileId = proof.match.give.profileId;

        // If there's an escrowed credit, spend it and award giver
        if (proof.match.escrowCreditId) {
          await tx.credit.update({
            where: { id: proof.match.escrowCreditId },
            data: { status: 'SPENT' },
          });

          // Award new credit to giver
          await tx.credit.create({
            data: {
              profileId: giverProfileId,
              status: 'AVAILABLE',
              source: 'EARNED',
            },
          });
        }

        // Update giver's reputation stats (increment successful matches only)
        // Note: totalMatches is incremented when match is accepted, not here
        const giverProfile = await tx.profile.findUnique({
          where: { id: giverProfileId },
        });

        if (giverProfile) {
          const newSuccessfulMatches = giverProfile.successfulMatches + 1;
          const newCompletionRate = giverProfile.totalMatches > 0
            ? (newSuccessfulMatches / giverProfile.totalMatches) * 100
            : 100.0;

          await tx.profile.update({
            where: { id: giverProfileId },
            data: {
              successfulMatches: newSuccessfulMatches,
              completionRate: newCompletionRate,
            },
          });
        }

        // Update match status to indicate completion
        await tx.match.update({
          where: { id: proof.matchId },
          data: { status: 'ACCEPTED' }, // Could add a new COMPLETED status if desired
        });
      });

      return NextResponse.json({ success: true, status: 'APPROVED' });
    } else {
      // Reject proof (no escrow changes)
      await prisma.referralProof.update({
        where: { id: proofId },
        data: { status: 'REJECTED' },
      });

      return NextResponse.json({ success: true, status: 'REJECTED' });
    }
  } catch (error) {
    console.error('Proof review error:', error);
    return NextResponse.json(
      { error: 'Failed to review proof' },
      { status: 500 }
    );
  }
}
