type EmptyStateProps = {
  readonly title: string;
  readonly description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 p-8 text-center">
      <h2 className="text-base font-semibold text-text">{title}</h2>
      <p className="text-text-muted">{description}</p>
    </div>
  );
}
