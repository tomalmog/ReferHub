export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
      <ol className="mt-6 space-y-6">
        <li>
          <Step title="Create your profile">
            Sign in, add your role/company. You can post an Ask (need a referral) or a Give (can refer).
          </Step>
        </li>
        <li>
          <Step title="Post a listing">
            Specify role, level, and target companies. Listings power matching and discovery.
          </Step>
        </li>
        <li>
          <Step title="Request a match">
            Pick one of your listings and request a match with someone of the opposite type. A credit is escrowed for accountability.
          </Step>
        </li>
        <li>
          <Step title="Chat and exchange">
            Share context and resume in chat. When the referral is submitted, escrow is released and the giver earns a credit.
          </Step>
        </li>
        <li>
          <Step title="Build reputation">
            Reliable partners rise via completion rate and recent activity, making future matches faster.
          </Step>
        </li>
      </ol>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5 transition hover:shadow-sm hover:border-foreground/20">
      <div className="text-lg font-medium">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}


