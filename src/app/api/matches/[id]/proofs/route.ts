import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const matchId = params.id;

    // Get current user's profile
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get the match and verify user is part of it
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        ask: { include: { profile: true } },
        give: { include: { profile: true } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify user is the giver (who should submit the proof)
    if (match.give.profileId !== profile.id) {
      return NextResponse.json(
        { error: 'Only the referrer can submit proof' },
        { status: 403 }
      );
    }

    // Verify match is accepted
    if (match.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Match must be accepted before submitting proof' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { fileUrl, description } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    // Create the referral proof
    const proof = await prisma.referralProof.create({
      data: {
        matchId,
        submittedById: profile.id,
        fileUrl,
        description: description || null,
        status: 'SUBMITTED',
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(proof);
  } catch (error) {
    console.error('Create proof error:', error);
    return NextResponse.json(
      { error: 'Failed to create proof' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const matchId = params.id;

    // Get current user's profile
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get the match and verify user is part of it
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        ask: { include: { profile: true } },
        give: { include: { profile: true } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify user is part of the match
    if (match.ask.profileId !== profile.id && match.give.profileId !== profile.id) {
      return NextResponse.json(
        { error: 'Not authorized to view proofs for this match' },
        { status: 403 }
      );
    }

    // Get all proofs for this match
    const proofs = await prisma.referralProof.findMany({
      where: { matchId },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(proofs);
  } catch (error) {
    console.error('Get proofs error:', error);
    return NextResponse.json(
      { error: 'Failed to get proofs' },
      { status: 500 }
    );
  }
}
