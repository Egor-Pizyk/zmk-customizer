import { useId } from 'react';
import { Button } from '@ui/components/components';
import { useKleImport } from '@ui/schematic/layout/logic';

export function KleImport() {
  const inputId = useId();
  const hintId = useId();
  const imported = useKleImport(inputId);
  const { review, error, isReading, isStale } = imported;
  return (
    <details className="max-w-full min-w-0">
      <summary
        data-onboarding-target="kle"
        className="flex h-7 cursor-pointer items-center rounded-md border border-border-strong px-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Import KLE layout
      </summary>
      <section
        aria-label="KLE layout import"
        className="flex max-h-64 flex-col gap-2 overflow-auto p-2"
      >
        <KleFileInput inputId={inputId} hintId={hintId} onFileChange={imported.handleFileChange} />
        {isReading ? <p>Reading KLE file…</p> : null}
        {error === undefined ? null : <p role="alert">{error}</p>}
        {isStale ? (
          <p role="alert">KLE review expired because the project changed. Choose the file again.</p>
        ) : null}
        {review === undefined || isStale ? null : <KleReview imported={imported} />}
        {review !== undefined || isReading || error !== undefined ? (
          <Button onClick={imported.handleCancel}>Cancel KLE import</Button>
        ) : null}
      </section>
    </details>
  );
}

function KleReview({ imported }: { readonly imported: ReturnType<typeof useKleImport> }) {
  const { review, handleApply } = imported;
  if (review === undefined) {
    return null;
  }
  return (
    <>
      <p>
        {review.layout.geometries.length} physical{' '}
        {review.layout.geometries.length === 1 ? 'key' : 'keys'} ready to import.
      </p>
      <p>
        The current name and controller stay. This replaces keys, wiring, layers, actions, custom
        behaviors, combos, macros, conditional layers and firmware settings. Undo restores the
        previous project.
      </p>
      <ul aria-label="KLE conversion warnings" className="list-inside list-disc">
        {review.layout.warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
      <Button onClick={handleApply}>Replace project with KLE layout</Button>
    </>
  );
}

function KleFileInput({
  inputId,
  hintId,
  onFileChange,
}: {
  readonly inputId: string;
  readonly hintId: string;
  readonly onFileChange: (file: File) => Promise<void>;
}) {
  return (
    <>
      <label htmlFor={inputId}>KLE JSON file</label>
      <p id={hintId} className="text-xs text-text-muted">
        Choose a downloaded Keyboard Layout Editor JSON file. Geometry only; wiring and actions need
        configuration.
      </p>
      <input
        id={inputId}
        type="file"
        accept=".json,application/json"
        aria-describedby={hintId}
        className="max-w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          input.value = '';
          if (file !== undefined) {
            void onFileChange(file);
          }
        }}
      />
    </>
  );
}
