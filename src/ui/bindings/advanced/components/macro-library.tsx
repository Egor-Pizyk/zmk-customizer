import { useProject } from '@ui/project/logic';
import { addMacro } from '@domain/advanced-keymap';
import { NewAdvancedName } from './new-advanced-name';
import { MacroEditor } from './macro-editor';

export function MacroLibrary({ reservedIds }: { readonly reservedIds: readonly string[] }) {
  const { project, commit } = useProject();
  return (
    <section aria-label="Macros" className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">Macros</h2>
      <NewAdvancedName
        kind="macro"
        isDisabled={project.macros.length >= 128}
        onCreate={(name) => {
          commit((current) => addMacro(current, { name, reservedIds }), `Created macro ${name}`);
        }}
      />
      {project.macros.length === 0 ? (
        <p>No macros yet. Create a sequence, then choose it in the Action picker.</p>
      ) : undefined}
      {project.macros.map((macro, index) => (
        <MacroEditor key={macro.id} macro={macro} index={index} />
      ))}
    </section>
  );
}
