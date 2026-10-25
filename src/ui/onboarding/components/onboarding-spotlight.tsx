import type { useOnboardingController } from '@ui/onboarding/logic';

export function OnboardingSpotlight({
  bounds,
}: {
  readonly bounds: ReturnType<typeof useOnboardingController>['bounds'];
}) {
  if (bounds === undefined) {
    return null;
  }
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 size-full"
      data-onboarding-scrim
    >
      <defs>
        <mask id="onboarding-hole">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={bounds.x}
            y={bounds.y}
            width={bounds.width}
            height={bounds.height}
            fill="black"
          />
        </mask>
      </defs>
      <rect width="100%" height="100%" className="fill-scrim" mask="url(#onboarding-hole)" />
      <rect
        x={bounds.x + 2}
        y={bounds.y + 2}
        width={Math.max(0, bounds.width - 4)}
        height={Math.max(0, bounds.height - 4)}
        className="fill-none stroke-focus"
        strokeWidth={2}
      />
    </svg>
  );
}
