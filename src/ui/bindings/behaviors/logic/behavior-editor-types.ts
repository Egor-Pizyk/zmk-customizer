import type { CustomBehavior, Project } from '@domain';

export type BehaviorEditorProps = {
  readonly behavior: CustomBehavior;
  readonly project: Project;
  readonly onChange: (value: CustomBehavior) => void;
};
