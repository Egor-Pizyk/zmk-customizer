export type ToolId = 'select' | 'add-key' | 'add-encoder' | 'wire';

export type Tool = {
  readonly id: ToolId;
  readonly label: string;
};

export const TOOLS: readonly Tool[] = [
  { id: 'select', label: 'Select' },
  { id: 'add-key', label: 'Key' },
  { id: 'add-encoder', label: 'Encoder' },
  { id: 'wire', label: 'Wire' },
];
