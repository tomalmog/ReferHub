# ReferHub (RFR)

A Next.js application that pairs referral seekers with employees who can provide referrals, using a credit-based escrow system to ensure accountability and reduce ghosting.

## Features

### Core Functionality
- **Dual-sided Marketplace**: Match "Ask" (job seekers) with "Give" (employees offering referrals)
- **Credit-based Escrow**: Automatic credit escrow when matches are created, released upon successful completion
- **Proof of Referral**: Upload and review referral evidence before releasing credits
- **Reputation System**: Track completion rates to incentivize quality referrals
- **Match Deadlines**: Automatic expiration of inactive matches with credit returns
- **Real-time Chat**: In-match messaging for coordination

### Technical Highlights
- **Next.js 15** with App Router
- **Prisma ORM** with SQLite (dev) / PostgreSQL (prod ready)
- **NextAuth.js** for Google & GitHub OAuth
- **Vercel Blob** for file uploads
- **TypeScript** throughout
- **Tailwind CSS** with shadcn/ui components

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Google OAuth credentials
- GitHub OAuth credentials (optional)
- Vercel Blob storage token (for proof uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ReferHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```bash
   # Database
   DATABASE_URL="file:./prisma/dev.db"  # SQLite for dev
   # DATABASE_URL="postgresql://..." # PostgreSQL for production

   # NextAuth
   AUTH_SECRET="your-random-secret-here"  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL="http://localhost:3000"   # Your app URL

   # Google OAuth (required)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # GitHub OAuth (optional)
   GITHUB_ID="your-github-client-id"
   GITHUB_SECRET="your-github-client-secret"

   # File Storage (Vercel Blob)
   BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
   ```

4. **Set up the database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ReferHub/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/               # Backend API endpoints
│   │   │   ├── auth/          # NextAuth configuration
│   │   │   ├── credits/       # Credit management
│   │   │   ├── listings/      # Listing CRUD
│   │   │   ├── matches/       # Match lifecycle
│   │   │   ├── notifications/ # Notification system
│   │   │   ├── profile/       # User profile
│   │   │   └── proofs/        # Referral proof review
│   │   ├── dashboard/         # User dashboard
│   │   ├── listings/          # Listing management
│   │   ├── explore/           # Browse and request matches
│   │   ├── matches/           # Match rooms with chat
│   │   ├── settings/          # User settings
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── site-header.tsx    # Main navigation
│   └── lib/
│       ├── auth.ts            # NextAuth configuration
│       ├── prisma.ts          # Prisma client
│       ├── notifications.ts   # Notification helpers
│       └── utils.ts           # Utility functions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
└── public/                    # Static assets
```

## User Flows

### For Job Seekers (Askers)
1. **Sign up** with Google/GitHub OAuth
2. **Create an "Ask" listing** with role, level, and target company
3. **Browse "Give" listings** and request a match (costs 1 credit)
4. **Wait for acceptance** (48-hour deadline)
5. **Chat with referrer** to provide details
6. **Review proof of referral** when submitted
7. **Approve proof** to release escrow and complete the match

### For Employees (Givers)
1. **Sign up** with Google/GitHub OAuth
2. **Create a "Give" listing** offering referrals
3. **Accept match requests** (commits to helping)
4. **Chat with candidate** to gather information
5. **Submit proof of referral** (screenshot, email, etc.)
6. **Earn credit** when proof is approved

## Database Schema

### Core Models
- **Profile**: User accounts with reputation (completionRate, totalMatches, successfulMatches)
- **Listing**: Ask/Give posts with role, level, company info
- **Match**: Connections between Ask/Give with status tracking and deadlines
- **Credit**: Escrow system (AVAILABLE → ESCROWED → SPENT/RETURNED)
- **ReferralProof**: Uploaded evidence with approval workflow
- **Message**: In-match chat
- **Notification**: User alerts (in-app)

### Key Workflows

#### Match Creation
```
1. Asker requests match
2. System finds available credit
3. Credit status: AVAILABLE → ESCROWED
4. Match created with deadlines:
   - acknowledgeBy: 48 hours
   - submitBy: 7 days (reset when accepted)
5. Giver receives notification
```

#### Match Acceptance
```
1. Giver accepts match
2. Match status: PENDING → ACCEPTED
3. submitBy deadline reset to +7 days
4. Giver's totalMatches incremented
5. Asker receives notification
6. Chat enabled
```

#### Proof Approval
```
1. Giver uploads proof file
2. Proof status: SUBMITTED
3. Asker reviews proof
4. If approved:
   - Proof status: APPROVED
   - Credit status: ESCROWED → SPENT
   - New credit created for giver (AVAILABLE, source: EARNED)
   - Giver's successfulMatches incremented
   - Completion rate recalculated
   - Both parties notified
5. If rejected:
   - Proof status: REJECTED
   - Escrow remains locked (manual intervention needed)
```

#### Match Expiration
```
Run /api/matches/expire via cron (e.g., Vercel Cron)

1. Find matches past deadlines:
   - PENDING matches past acknowledgeBy
   - ACCEPTED matches past submitBy (no approved proof)
2. For each expired match:
   - Match status: → EXPIRED
   - Credit status: ESCROWED → RETURNED
   - New AVAILABLE credit granted to asker
   - Parties notified
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - OAuth sign-in
- `POST /api/auth/signout` - Sign out

### Listings
- `GET /api/listings` - Get user's listings
- `POST /api/listings` - Create listing
- `PATCH /api/listings/[id]` - Update listing
- `DELETE /api/listings/[id]` - Delete listing
- `GET /api/listings/public` - Browse public listings (filtered)

### Matches
- `GET /api/matches` - Get user's matches
- `POST /api/matches` - Request a match (escrows credit)
- `GET /api/matches/[id]` - Get match details
- `POST /api/matches/[id]/accept` - Accept match (giver only)
- `POST /api/matches/[id]/decline` - Decline match (returns credit)
- `POST /api/matches/expire` - Expire matches past deadlines (cron)

### Messages
- `GET /api/matches/[id]/messages` - Get chat messages
- `POST /api/matches/[id]/messages` - Send message

### Proofs
- `GET /api/matches/[id]/proofs` - Get proofs for match
- `POST /api/matches/[id]/proofs` - Submit proof (giver only)
- `PATCH /api/proofs/[id]` - Approve/reject proof (asker only)

### Credits
- `GET /api/credits` - Get credit counts
- `POST /api/credits` - Grant dev credit (dev only)

### Profile
- `GET /api/profile` - Get current user profile
- `PATCH /api/profile` - Update profile

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications` - Mark notifications as read

### Uploads
- `POST /api/upload` - Upload file to Vercel Blob (10MB max)

## Deployment

### Vercel (Recommended)
1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Update DATABASE_URL** to PostgreSQL connection string
4. **Add Vercel Blob** storage
5. **Deploy!**

### Vercel Cron (for match expiration)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/matches/expire",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Database Migration (SQLite → PostgreSQL)
```bash
# Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@host:5432/referhub"

# Run migrations
npm run prisma:migrate
```

## Development Roadmap

### Completed ✅
- OAuth authentication (Google, GitHub)
- Listing creation and management
- Match request and acceptance
- Credit escrow system
- In-match chat
- Referral proof upload and review
- Reputation system (completion rates)
- Match deadlines and auto-expiry
- Profile settings
- Notification infrastructure

### In Progress 🚧
- In-app notification UI (bell icon)
- Email notifications
- Admin dashboard

### Planned 📋
- Employment verification (domain checks)
- Advanced search and filtering
- Reporting system
- Rate limiting
- Analytics dashboard
- Mobile app
- Slack/Discord integrations

## Contributing

This is a private project. For bug reports or feature requests, please contact the maintainers.

## License

Proprietary - All rights reserved

---

**Built with ❤️ using Next.js, Prisma, and TypeScript**
