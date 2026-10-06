import type { KeyboardEvent } from 'react';
import { ExternalLinkIcon } from './icons/external-link-icon';

type DocsLinkProps = {
  readonly href: string;
  /** What the page explains, for screen readers: "Docs for Sticky key (opens in a new tab)". */
  readonly topic: string;
  /** -1 inside a composite widget that moves focus to the link with arrow keys. */
  readonly tabIndex?: number;
  readonly onKeyDown?: (event: KeyboardEvent<HTMLAnchorElement>) => void;
};

// admin-ui.md "ZMK option pattern": the URL always comes from a catalog entry's docsUrl. An
// external-link arrow (24 px target, WCAG 2.5.8); the name and new tab are in the text.
export function DocsLink({ href, topic, tabIndex, onKeyDown: handleKeyDown }: DocsLinkProps) {
  return (
    <a
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-md align-middle text-accent hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      href={href}
      onKeyDown={handleKeyDown}
      rel="noreferrer"
      tabIndex={tabIndex}
      target="_blank"
      title={`ZMK docs: ${topic}`}
    >
      <ExternalLinkIcon />
      <span className="sr-only">Docs for {topic} (opens in a new tab)</span>
    </a>
  );
}
