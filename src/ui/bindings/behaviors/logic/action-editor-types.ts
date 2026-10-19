import type { Binding, Project } from '@domain';

export type ActionEditorProps = {
  readonly label: string;
  readonly binding: Binding;
  readonly project: Project;
  readonly onChange: (binding: Binding) => void;
};
