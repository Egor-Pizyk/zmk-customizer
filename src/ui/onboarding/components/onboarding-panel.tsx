import { Button } from '@ui/components/components';
import { useOnboardingController } from '@ui/onboarding/logic';
import { OnboardingSpotlight } from './onboarding-spotlight';
import { OnboardingSessionDialogs } from './onboarding-session-dialogs';

type Tour = ReturnType<typeof useOnboardingController>;
export function OnboardingPanel() {
  const tour = useOnboardingController();
  return (
    <>
      <OnboardingSpotlight bounds={tour.bounds} />
      <aside
        aria-label="Interactive learning"
        className="relative z-30 flex max-h-64 shrink-0 flex-col gap-2 overflow-hidden border-t border-border-strong bg-surface-raised p-4 text-text"
        data-onboarding-panel
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            className="text-base font-semibold focus-visible:outline-2 focus-visible:outline-focus"
            tabIndex={-1}
          >
            {tour.content.title}
          </h2>
          <span>
            Step {tour.index + 1} of {tour.total} · Learning project
          </span>
        </div>
        <section
          className="min-h-0 overflow-auto focus-visible:outline-2 focus-visible:outline-focus"
          tabIndex={0}
          aria-label="Step instructions"
        >
          <TourCopy tour={tour} />
        </section>
        <TourNavigation tour={tour} />
      </aside>
      <OnboardingSessionDialogs tour={tour} />
    </>
  );
}
function TourCopy({ tour }: { readonly tour: Tour }) {
  return (
    <>
      <p>{tour.content.why}</p>
      <p>{tour.content.action}</p>
      {tour.bounds === undefined ? (
        <p>
          The highlighted control is not visible. Open the relevant workspace/panel, retry, or exit
          safely.{' '}
          <Button
            onClick={() => {
              tour.retryTarget();
            }}
          >
            Find control again
          </Button>
        </p>
      ) : undefined}
      {tour.stepId === 'files' ? (
        <p>
          File groups inspected: {tour.context.tutorial?.viewedFiles?.length ?? 0} of 3. Use each
          file’s Inspect file button.
        </p>
      ) : undefined}
      {tour.content.requiresAction !== true && !tour.condition ? (
        <p>
          Complete the required project conditions above before continuing. Check Problems for
          repairs.
        </p>
      ) : undefined}
    </>
  );
}
function TourNavigation({ tour }: { readonly tour: Tour }) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button
        isDisabled={tour.index === 0}
        onClick={() => {
          tour.context.previousTutorialStep();
        }}
      >
        Back
      </Button>
      {tour.stepId === 'finish' ? <FinishActions tour={tour} /> : <ContinueActions tour={tour} />}
      <Button
        onClick={() => {
          tour.setDialog('exit');
        }}
      >
        Exit tour
      </Button>
    </div>
  );
}
function FinishActions({ tour }: { readonly tour: Tour }) {
  return (
    <>
      <Button
        onClick={() => {
          tour.context.leaveTutorial(false);
        }}
      >
        Return to original project
      </Button>
      <Button
        onClick={() => {
          tour.setDialog('adopt');
        }}
      >
        Keep learning project
      </Button>
    </>
  );
}
function ContinueActions({ tour }: { readonly tour: Tour }) {
  return (
    <>
      {tour.content.requiresAction !== true || (tour.condition && tour.stepId !== 'download') ? (
        <Button
          isDisabled={!tour.canContinue}
          onClick={() => {
            tour.context.nextTutorialStep();
          }}
        >
          Confirm and continue
        </Button>
      ) : undefined}
      <Button
        onClick={() => {
          tour.setDialog('exit');
        }}
      >
        Skip tour
      </Button>
    </>
  );
}
