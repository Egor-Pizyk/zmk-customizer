import { Button, Dialog } from '@ui/components/components';
import { useOnboardingWelcome } from '@ui/onboarding/logic';

export function OnboardingWelcome({ isReplay }: { readonly isReplay: boolean }) {
  const welcome = useOnboardingWelcome(isReplay);
  return (
    <>
      {!welcome.isOpen && welcome.error !== '' ? <p role="alert">{welcome.error}</p> : undefined}
      <Dialog isOpen={welcome.isOpen} onClose={welcome.handleClose} title="Learn ZMK Customizer">
        <p>
          Build a real 3×3 macropad from an empty learning project, then download its ZMK v0.3.0
          configuration. Your current project and its Undo/Redo history stay protected. Exit at any
          step to return.
        </p>
        <p>
          This tour is offered automatically once. Use Take the tour again in the lower navigation
          whenever you want to return.
        </p>
        {welcome.error === '' ? undefined : <p role="alert">{welcome.error}</p>}
        <WelcomeActions welcome={welcome} />
        <Button onClick={welcome.handleClose}>Skip tour</Button>
      </Dialog>
    </>
  );
}
function WelcomeActions({
  welcome,
}: {
  readonly welcome: ReturnType<typeof useOnboardingWelcome>;
}) {
  if (!welcome.retained.ok) {
    return <WelcomeRecovery welcome={welcome} />;
  }
  return (
    <>
      {welcome.confirmNew ? (
        <p>
          Starting again replaces only the retained learning draft. Your original project stays
          protected. Choose Start empty learning project again to confirm, or cancel.
        </p>
      ) : undefined}
      <Button
        onClick={() => {
          welcome.handleStart(false);
        }}
      >
        Start empty learning project
      </Button>
      {welcome.retained.value === undefined ? undefined : (
        <Button
          onClick={() => {
            welcome.handleStart(true);
          }}
        >
          Resume learning session
        </Button>
      )}
    </>
  );
}

function WelcomeRecovery({
  welcome,
}: {
  readonly welcome: ReturnType<typeof useOnboardingWelcome>;
}) {
  return (
    <>
      <p>{welcome.retained.ok ? '' : welcome.retained.error}</p>
      <Button onClick={welcome.handleRecover}>Download saved learning data</Button>
      <Button onClick={welcome.handleDiscard}>Discard unreadable learning session</Button>
    </>
  );
}
