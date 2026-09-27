export type ToolId = 'select' | 'add-key' | 'wire';

export type Tool = {
  readonly id: ToolId;
  readonly label: string;
  readonly isAvailable: boolean;
};

// Only Select works in spec 001; the rest are placeholders for later features.
export const TOOLS: readonly Tool[] = [
  { id: 'select', label: 'Select', isAvailable: true },
  { id: 'add-key', label: 'Add key', isAvailable: false },
  { id: 'wire', label: 'Wire', isAvailable: false },
];
