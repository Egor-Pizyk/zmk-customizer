import { ADVANCED_OPTIONS } from '@catalog/bindings';
import { DocsLink, Field } from '@ui/components/components';
import type { FieldControlProps } from '@ui/components/components';
import type { ReactNode } from 'react';

export type AdvancedProperty = keyof typeof ADVANCED_OPTIONS;
export function AdvancedField({
  property,
  children,
}: {
  readonly property: AdvancedProperty;
  readonly children: (props: FieldControlProps) => ReactNode;
}) {
  const entry = ADVANCED_OPTIONS[property];
  return (
    <Field
      label={entry.label}
      description={
        <>
          {entry.description} <DocsLink href={entry.docsUrl} topic={entry.label} />
        </>
      }
      renderControl={children}
    />
  );
}
