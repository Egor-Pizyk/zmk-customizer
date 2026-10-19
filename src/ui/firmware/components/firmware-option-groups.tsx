import { FIRMWARE_OPTIONS } from '@catalog/firmware';
import type { FirmwareOption } from '@domain/firmware';
import { resetFirmwareOption } from '@domain/firmware';
import { useProject } from '@ui/project/logic';
import { Button } from '@ui/components/components';
import { FirmwareSetting } from './firmware-setting';

function matchesSearch(option: FirmwareOption, search: string): boolean {
  return `${option.id} ${option.label} ${option.category} ${option.description}`
    .toLowerCase()
    .includes(search.trim().toLowerCase());
}

export function FirmwareOptionGroups({ search }: { readonly search: string }) {
  const categories = [...new Set(FIRMWARE_OPTIONS.map((option) => option.category))];
  return (
    <>
      {!FIRMWARE_OPTIONS.some((option) => matchesSearch(option, search)) && (
        <output>No firmware settings match your search.</output>
      )}
      {categories.map((category) => (
        <section
          hidden={
            !FIRMWARE_OPTIONS.some(
              (option) => option.category === category && matchesSearch(option, search),
            )
          }
          key={category}
          aria-label={category}
        >
          <h2 className="mb-2 text-base font-semibold">{category}</h2>
          <div className="grid gap-3 xl:grid-cols-2">
            {FIRMWARE_OPTIONS.filter((option) => option.category === category).map((option) => (
              <div hidden={!matchesSearch(option, search)} key={option.id}>
                <FirmwareSetting option={option} />
              </div>
            ))}
          </div>
        </section>
      ))}
      <UnknownFirmwareSettings />
    </>
  );
}

function UnknownFirmwareSettings() {
  const { project, issues, commit } = useProject();
  const unknown = Object.keys(project.firmware).filter(
    (id) => !FIRMWARE_OPTIONS.some((option) => option.id === id),
  );
  return (
    <>
      {unknown.map((id) => (
        <div key={id}>
          <p data-issue-path={`firmware.${id}`} tabIndex={-1}>
            {issues.find((issue) => issue.path[1] === id)?.message}
          </p>
          <Button
            onClick={() => {
              commit((latest) => resetFirmwareOption(latest, id));
            }}
          >
            Reset {id}
          </Button>
        </div>
      ))}
    </>
  );
}
