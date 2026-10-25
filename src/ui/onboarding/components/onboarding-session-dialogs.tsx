import { Button, Dialog } from '@ui/components/components';
import type { useOnboardingController } from '@ui/onboarding/logic';

type Tour = ReturnType<typeof useOnboardingController>;
export function OnboardingSessionDialogs({ tour }: { readonly tour: Tour }) {
  return (
    <Dialog
      isOpen={tour.dialog !== undefined}
      onClose={() => {
        tour.setDialog(undefined);
      }}
      title={tour.dialog === 'adopt' ? 'Keep the learning project?' : 'Leave the tour?'}
    >
      {tour.dialog === 'adopt' ? (
        <Adoption context={tour.context} />
      ) : (
        <ExitChoices context={tour.context} />
      )}
      <Button
        onClick={() => {
          tour.setDialog(undefined);
        }}
      >
        Cancel
      </Button>
    </Dialog>
  );
}
function Adoption({ context }: { readonly context: Tour['context'] }) {
  return (
    <>
      <p>
        This replaces your current project with the learning macropad. Save your original work to a
        file before replacing it.
      </p>
      <Button
        onClick={() => {
          context.saveOriginalProject();
        }}
      >
        Save original project
      </Button>
      <Button
        onClick={() => {
          context.adoptTutorial();
        }}
      >
        Replace current project with macropad
      </Button>
    </>
  );
}
function ExitChoices({ context }: { readonly context: Tour['context'] }) {
  return (
    <>
      <p>
        Your original project will return. You can retain this learning session and resume it from
        the lower replay button.
      </p>
      <Button
        onClick={() => {
          context.leaveTutorial(false);
        }}
      >
        Save learning session and exit
      </Button>
      <Button
        variant="danger"
        onClick={() => {
          context.leaveTutorial(true);
        }}
      >
        Discard learning session and exit
      </Button>
    </>
  );
}
