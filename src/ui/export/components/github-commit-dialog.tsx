import { useState } from 'react';
import type { GithubReview } from '@storage/github';
import { Button, Dialog, Field } from '@ui/components/components';
import type { useGithubPublication } from '@ui/export/logic';

type GithubCommitDialogProps = {
  readonly publication: ReturnType<typeof useGithubPublication>;
  readonly isBusy: boolean;
};

export function GithubCommitDialog({ publication, isBusy }: GithubCommitDialogProps) {
  return (
    <Dialog
      isOpen={publication.review !== undefined}
      onClose={publication.handleCloseReview}
      title="Review GitHub commit"
      size="wide"
    >
      {publication.review === undefined ? undefined : (
        <>
          <GithubCommitChanges review={publication.review} />
          <GithubCommitForm publication={publication} isBusy={isBusy} />
        </>
      )}
    </Dialog>
  );
}

function GithubCommitChanges({ review }: { readonly review: GithubReview }) {
  const { repository, branch } = review.destination;
  const baseUrl = `https://github.com/${repository.full_name}/blob/${review.head}`;
  return (
    <>
      <p className="text-sm wrap-anywhere">
        <strong>{repository.full_name}</strong>
        {' · '}
        {branch}
        {' · '}
        {repository.private ? 'Private repository' : 'Public repository'}
      </p>
      <p className="text-sm text-text-muted">
        The commit includes the editable project when it has changed. Review the current version of
        files marked Replace before overwriting them.
      </p>
      <ul className="flex max-h-60 flex-col gap-1 overflow-auto rounded-md border border-border p-2 text-sm">
        {review.changes.map((file) => (
          <GithubChangedFile key={file.path} file={file} baseUrl={baseUrl} />
        ))}
      </ul>
    </>
  );
}

function GithubChangedFile({
  file,
  baseUrl,
}: {
  readonly file: GithubReview['changes'][number];
  readonly baseUrl: string;
}) {
  const path = file.path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return (
    <li className="flex items-baseline gap-2">
      <strong className="min-w-14">{file.change === 'add' ? 'Add' : 'Replace'}</strong>
      <code className="min-w-0 wrap-anywhere">
        {file.change === 'add' ? (
          file.path
        ) : (
          <a
            className="text-accent underline"
            href={`${baseUrl}/${path}`}
            target="_blank"
            rel="noreferrer"
          >
            {file.path}
          </a>
        )}
      </code>
    </li>
  );
}

function GithubCommitForm({ publication, isBusy }: GithubCommitDialogProps) {
  const [message, setMessage] = useState('Update ZMK firmware configuration');
  return (
    <>
      <Field
        label="Commit message"
        renderControl={(props) => (
          <input
            {...props}
            className="w-full rounded-md border border-border bg-surface px-2 py-1"
            maxLength={200}
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
            }}
          />
        )}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={publication.handleCloseReview}>
          Cancel
        </Button>
        <Button
          variant="primary"
          isDisabled={isBusy || publication.isReviewStale || message.trim() === ''}
          hint={
            publication.isReviewStale
              ? 'The project changed. Close and review the commit again.'
              : undefined
          }
          onClick={() => {
            publication.publish(message);
          }}
        >
          Commit to GitHub
        </Button>
      </div>
    </>
  );
}
