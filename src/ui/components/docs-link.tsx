type DocsLinkProps = {
  readonly href: string;
  /** What the page explains, for screen readers: "Docs for Sticky key (opens in a new tab)". */
  readonly topic: string;
};

// admin-ui.md "ZMK option pattern": the URL always comes from a catalog entry's docsUrl.
export function DocsLink({ href, topic }: DocsLinkProps) {
  return (
    <a
      className="rounded-md text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      Docs<span className="sr-only"> for {topic} (opens in a new tab)</span>
    </a>
  );
}
