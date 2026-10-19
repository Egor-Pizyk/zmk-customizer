import { CUSTOM_BEHAVIOR_PROPERTIES } from '@catalog/bindings';
import { DocsLink, Field } from '@ui/components/components';
import type { FieldControlProps } from '@ui/components/components';
import type { ReactNode } from 'react';

export type Property = keyof typeof CUSTOM_BEHAVIOR_PROPERTIES;
export function BehaviorField({
  property,
  children,
}: {
  readonly property: Property;
  readonly children: (props: FieldControlProps) => ReactNode;
}) {
  const entry = CUSTOM_BEHAVIOR_PROPERTIES[property];
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
