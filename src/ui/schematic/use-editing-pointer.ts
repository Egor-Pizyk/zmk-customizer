import type { SchematicPointerOptions } from './pointer-types';
import { useKeyTransformPointer } from './use-key-transform-pointer';
import { useSchematicPointer } from './use-schematic-pointer';

export function useEditingPointer(options: SchematicPointerOptions) {
  const pointer = useSchematicPointer(options);
  return useKeyTransformPointer(pointer, options);
}
