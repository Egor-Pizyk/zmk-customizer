import type { ReactNode } from 'react';

export function PartsGroup({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <details>
      <summary className="cursor-pointer py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <h3 className="inline font-semibold">{title}</h3>
      </summary>
      <div className="flex flex-col gap-2">{children}</div>
    </details>
  );
}
