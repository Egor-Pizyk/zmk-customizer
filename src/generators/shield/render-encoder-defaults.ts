import type { Project } from '@domain';

export function renderEncoderDefaults(project: Project): string {
  return project.encoders.length === 0
    ? ''
    : `if DT_HAS_ALPS_EC11_ENABLED

config EC11
    default y

choice EC11_TRIGGER_MODE
    default EC11_TRIGGER_GLOBAL_THREAD
endchoice

endif

`;
}
