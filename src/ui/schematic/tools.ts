export type ToolId = 'select' | 'add-key' | 'wire';

export type Tool = {
  readonly id: ToolId;
  readonly label: string;
};

export const TOOLS: readonly Tool[] = [
  { id: 'select', label: 'Select' },
  { id: 'add-key', label: 'Key' },
  { id: 'wire', label: 'Wire' },
];
