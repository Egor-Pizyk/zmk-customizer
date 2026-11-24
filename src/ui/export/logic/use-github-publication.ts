import { useState } from 'react';
import type { Project } from '@domain';
import type { GeneratedFile } from '@generators';
import {
  commitGithubPublication,
  openGithubProject,
  reviewGithubPublication,
} from '@storage/github';
import type { GithubReview } from '@storage/github';
import { useProject } from '@ui/project/logic';
import type { GithubSession } from './use-github-session';

function useGithubCommitReview(
  github: GithubSession,
  files: readonly GeneratedFile[],
  useGeneratedWorkflow: boolean,
) {
  const { project } = useProject();
  const [review, setReview] = useState<{
    readonly base: Project;
    readonly details: GithubReview;
  }>();
  const { token, destination } = github;

  function handleReview() {
    if (token === undefined || destination === undefined || files.length === 0) {
      return;
    }
    void github.run(async () => {
      const result = await reviewGithubPublication(token, destination, {
        files,
        project,
        useGeneratedWorkflow,
      });
      if (result.ok && result.value.changes.length === 0) {
        await github.trackPublication(token, destination, result.value.head);
        github.setFeedback('The branch already contains these files.');
      } else if (result.ok) {
        setReview({ base: project, details: result.value });
      }
      return result;
    });
  }

  return {
    review,
    handleReview,
    handleCloseReview: () => {
      setReview(undefined);
    },
  };
}

export function useGithubPublication(
  github: GithubSession,
  files: readonly GeneratedFile[],
  useGeneratedWorkflow: boolean,
) {
  const { project } = useProject();
  const { review, handleReview, handleCloseReview } = useGithubCommitReview(
    github,
    files,
    useGeneratedWorkflow,
  );
  const { token } = github;

  function publish(message: string) {
    if (token === undefined || review === undefined || review.base !== project) {
      return;
    }
    void github.run(async () => {
      handleCloseReview();
      const result = await commitGithubPublication(token, review.details, message);
      return result.ok
        ? github.trackPublication(token, review.details.destination, result.value)
        : result;
    });
  }

  return {
    review: review?.details,
    isReviewStale: review !== undefined && review.base !== project,
    handleReview,
    publish,
    handleCloseReview,
  };
}

export function useGithubOpen(github: GithubSession) {
  const { project, commit } = useProject();
  const [opened, setOpened] = useState<{ readonly base: Project; readonly remote: Project }>();
  const { token, destination } = github;

  function handleOpen() {
    if (token === undefined || destination === undefined) {
      return;
    }
    void github.run(async () => {
      const result = await openGithubProject(token, destination);
      if (result.ok) {
        setOpened({ base: project, remote: result.value });
      }
      return result;
    });
  }

  function handleConfirmOpen() {
    if (opened !== undefined) {
      commit(
        (latest) => (latest === opened.base ? opened.remote : latest),
        'Opened project from GitHub',
      );
      setOpened(undefined);
    }
  }

  return {
    name: opened?.remote.name,
    isOpenStale: opened !== undefined && opened.base !== project,
    handleOpen,
    handleConfirmOpen,
    handleCloseOpen: () => {
      setOpened(undefined);
    },
  };
}
