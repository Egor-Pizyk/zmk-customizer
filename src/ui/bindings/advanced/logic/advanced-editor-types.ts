export type AdvancedEditorProps = {
  readonly selectedKeyIds: readonly string[];
  readonly onSelectKeys: (ids: readonly string[]) => void;
  readonly reservedMacroIds: readonly string[];
};
