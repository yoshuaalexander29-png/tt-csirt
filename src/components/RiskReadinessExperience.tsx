import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/gcds/Button";

const RiskReadinessGame3D = lazy(() => import("./RiskReadinessGame3D"));

const LESSONS = [
  "Inventory important devices, services, information and dependencies.",
  "Limit internet exposure to services that need to be public.",
  "Prioritise known exploited weaknesses on exposed, important systems.",
  "Use multi-factor authentication on important and administrator accounts.",
  "Protect backups and practise restoring information from them.",
];

export function RiskReadinessExperience() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="risk-game" aria-labelledby="risk-game-heading">
      <div className="risk-game__intro">
        <p className="govuk-caption-m">Optional interactive exercise</p>
        <h2 className="govuk-heading-l" id="risk-game-heading">Secure the island office</h2>
        <p className="govuk-body">
          Help local coordinator Kaya prepare the island service hub for its opening day. Choose an explorer, follow five trail markers and make practical cyber security decisions along the way.
        </p>
      </div>

      <div className="risk-game__lessons" aria-label="What this exercise covers">
        <p className="govuk-heading-s">What you will practise</p>
        <ol className="govuk-list govuk-list--number">
          {LESSONS.map((lesson) => <li key={lesson}>{lesson}</li>)}
        </ol>
      </div>

      {!playing ? (
        <Button className="risk-game__start" role="primary" type="button" onClick={() => setPlaying(true)}>
          Choose your explorer
        </Button>
      ) : (
        <Suspense fallback={<p role="status" className="govuk-body">Loading the interactive office…</p>}>
          <RiskReadinessGame3D />
        </Suspense>
      )}

      <p className="govuk-body-s risk-game__disclaimer">
        This exercise teaches general risk-management ideas. It is not a security assessment, compliance check or measure of how secure an organisation is.
      </p>
    </section>
  );
}

