export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Features</h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        ReferHub helps employees and candidates exchange referrals fairly with accountability, matching, and a simple workflow.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard title="Verified Employment" desc="Work email/domain checks and completion rates reduce spam and bad actors." />
        <FeatureCard title="Escrowed Credits" desc="Earn and spend non-monetary credits; escrow at match to prevent ghosting." />
        <FeatureCard title="Guided Workflow" desc="Deadlines, reminders, and proof upload keep both sides on track." />
        <FeatureCard title="Smart Matching" desc="Filter by role, level, and target companies to find relevant partners." />
        <FeatureCard title="Chat & Files" desc="In-app chat with resume upload and helpful templates." />
        <FeatureCard title="Trust & Safety" desc="Reports, rate limits, and admin tools keep the community healthy." />
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border p-6 transition hover:shadow-sm hover:border-foreground/20">
      <div className="text-lg font-medium">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}


