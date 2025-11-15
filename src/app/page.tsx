import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Get referred. Give referrals. Fairly.
          </h1>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            RFR pairs employees and candidates with a credit-based escrow to reduce
            ghosting and make referrals reliable—especially for interns and new grads.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg">Get started</Button>
            <Button size="lg" variant="secondary">
              Learn more
            </Button>
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-2 lg:mt-24 lg:grid-cols-3">
          <Card className="transition hover:shadow-sm hover:border-foreground/20">
            <CardHeader>
              <CardTitle>Verified Employment</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Reduce spam with work email/domain checks and completion rates.
            </CardContent>
          </Card>
          <Card className="transition hover:shadow-sm hover:border-foreground/20">
            <CardHeader>
              <CardTitle>Escrowed Credits</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Earn and spend non-monetary credits with automatic timeouts.
            </CardContent>
          </Card>
          <Card className="transition hover:shadow-sm hover:border-foreground/20">
            <CardHeader>
              <CardTitle>Guided Workflow</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Deadlines, reminders, and evidence upload keep both sides aligned.
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
