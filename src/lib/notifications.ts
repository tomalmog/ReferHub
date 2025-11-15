import { prisma } from './prisma';

type NotificationType =
  | 'MATCH_REQUEST'
  | 'MATCH_ACCEPTED'
  | 'NEW_MESSAGE'
  | 'PROOF_SUBMITTED'
  | 'PROOF_APPROVED'
  | 'PROOF_REJECTED'
  | 'MATCH_EXPIRED'
  | 'CREDIT_EARNED';

interface CreateNotificationParams {
  profileId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        profileId: params.profileId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't throw - notifications are nice-to-have, shouldn't break main flow
  }
}

/**
 * Notify when a new match is requested
 */
export async function notifyMatchRequest(giverProfileId: string, matchId: string, askerName: string) {
  await createNotification({
    profileId: giverProfileId,
    type: 'MATCH_REQUEST',
    title: 'New match request',
    message: `${askerName} wants you to refer them`,
    link: `/matches/${matchId}`,
  });
}

/**
 * Notify when a match is accepted
 */
export async function notifyMatchAccepted(askerProfileId: string, matchId: string, giverName: string) {
  await createNotification({
    profileId: askerProfileId,
    type: 'MATCH_ACCEPTED',
    title: 'Match accepted',
    message: `${giverName} accepted your referral request`,
    link: `/matches/${matchId}`,
  });
}

/**
 * Notify when a new message is received
 */
export async function notifyNewMessage(recipientProfileId: string, matchId: string, senderName: string) {
  await createNotification({
    profileId: recipientProfileId,
    type: 'NEW_MESSAGE',
    title: 'New message',
    message: `${senderName} sent you a message`,
    link: `/matches/${matchId}`,
  });
}

/**
 * Notify when proof is submitted
 */
export async function notifyProofSubmitted(askerProfileId: string, matchId: string, giverName: string) {
  await createNotification({
    profileId: askerProfileId,
    type: 'PROOF_SUBMITTED',
    title: 'Referral proof submitted',
    message: `${giverName} submitted proof of referral. Review it now!`,
    link: `/matches/${matchId}`,
  });
}

/**
 * Notify when proof is approved
 */
export async function notifyProofApproved(giverProfileId: string, matchId: string) {
  await createNotification({
    profileId: giverProfileId,
    type: 'PROOF_APPROVED',
    title: 'Proof approved',
    message: 'Your referral proof was approved! Credit earned.',
    link: `/matches/${matchId}`,
  });
}

/**
 * Notify when proof is rejected
 */
export async function notifyProofRejected(giverProfileId: string, matchId: string) {
  await createNotification({
    profileId: giverProfileId,
    type: 'PROOF_REJECTED',
    title: 'Proof rejected',
    message: 'Your referral proof was rejected.',
    link: `/matches/${matchId}`,
  });
}

/**
 * Notify when credit is earned
 */
export async function notifyCreditEarned(profileId: string) {
  await createNotification({
    profileId,
    type: 'CREDIT_EARNED',
    title: 'Credit earned',
    message: 'You earned a new credit for completing a referral!',
    link: '/dashboard',
  });
}
