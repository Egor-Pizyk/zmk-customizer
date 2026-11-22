import type { Project } from '@domain';

export type DiagramGestureToken = {
  readonly project: Project;
  readonly revision: number;
  readonly generation: number;
  readonly pointerId: number;
};

type SessionState = {
  generation: number;
  token: DiagramGestureToken | undefined;
};
type StartInput = {
  readonly project: Project;
  readonly pointerId: number;
  readonly isReadOnly: boolean;
};
type CompletionInput = StartInput & {
  readonly token: DiagramGestureToken;
  readonly change: (project: Project) => Project;
};
type CurrentInput = Pick<CompletionInput, 'project' | 'token'>;

export function createDiagramGestureSession(getRevision: () => number) {
  const session: SessionState = { generation: 0, token: undefined };
  return {
    getToken: () => session.token,
    start: (input: StartInput) => {
      session.generation += 1;
      session.token = input.isReadOnly
        ? undefined
        : {
            project: input.project,
            pointerId: input.pointerId,
            generation: session.generation,
            revision: getRevision(),
          };
      return session.token;
    },
    isCurrent: (input: CurrentInput) => isCurrent(session, getRevision, input),
    finish: (input: CompletionInput) => {
      const matches = session.token === input.token && input.pointerId === input.token.pointerId;
      const accepted = matches && !input.isReadOnly && isCurrent(session, getRevision, input);
      if (matches) {
        session.token = undefined;
      }
      return accepted ? createGuardedChange(session, getRevision, input) : undefined;
    },
    cancel: () => {
      session.token = undefined;
      session.generation += 1;
    },
  };
}

function isCurrent(session: SessionState, getRevision: () => number, input: CurrentInput) {
  return (
    session.token === input.token &&
    input.project === input.token.project &&
    session.generation === input.token.generation &&
    getRevision() === input.token.revision
  );
}

function createGuardedChange(
  session: SessionState,
  getRevision: () => number,
  input: CompletionInput,
) {
  // Consumption precedes dispatch. React may reevaluate this pure command.
  return (current: Project) =>
    current === input.token.project &&
    getRevision() === input.token.revision &&
    session.generation === input.token.generation
      ? input.change(current)
      : current;
}

export type DiagramGestureSession = ReturnType<typeof createDiagramGestureSession>;
