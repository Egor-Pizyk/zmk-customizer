import type { Project } from '@domain';

export function EncodersLayer({ project }: { readonly project: Project }) {
  return project.encoders.map((encoder, index) => (
    <g
      key={encoder.id}
      role="graphics-symbol"
      aria-label={`Encoder ${index}, ${encoder.half}, at ${encoder.xU}, ${encoder.yU}. Edit in Encoders below.`}
      className="pointer-events-none"
    >
      <circle
        cx={encoder.xU + 0.5}
        cy={encoder.yU + 0.5}
        r={0.45}
        className="fill-surface-raised stroke-accent"
        strokeWidth={0.05}
      />
      <path
        d={`M ${encoder.xU + 0.5} ${encoder.yU + 0.15} v 0.25`}
        className="stroke-accent"
        strokeWidth={0.05}
      />
      <text
        x={encoder.xU + 0.5}
        y={encoder.yU + 0.75}
        textAnchor="middle"
        fontSize={0.3}
        className="fill-text"
        aria-hidden="true"
      >{`E${index}`}</text>
    </g>
  ));
}
