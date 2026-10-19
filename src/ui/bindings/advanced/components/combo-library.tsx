import type { AdvancedEditorProps } from '@ui/bindings/advanced/logic';
import { useProject } from '@ui/project/logic';
import { addCombo } from '@domain/advanced-keymap';
import { NewAdvancedName } from './new-advanced-name';
import { ComboEditor } from './combo-editor';

export function ComboLibrary(props: AdvancedEditorProps) {
  const { project, commit } = useProject();
  return (
    <section aria-label="Combos" className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">Combos</h2>
      <NewAdvancedName
        kind="combo"
        isDisabled={project.combos.length >= 128}
        onCreate={(name) => {
          commit(
            (current) => addCombo(current, { name, keyIds: props.selectedKeyIds }),
            `Created combo ${name}`,
          );
        }}
      />
      {project.combos.length === 0 ? (
        <p>No combos yet. Select keys on the layout or choose them in the editor.</p>
      ) : undefined}
      {project.combos.map((combo, index) => (
        <ComboEditor key={combo.id} combo={combo} index={index} {...props} />
      ))}
    </section>
  );
}
