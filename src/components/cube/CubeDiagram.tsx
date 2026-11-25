import { memo, useMemo } from 'react';

import { applyAlgorithm, caseFromAlgorithm, moveLayer, solvedCube } from '@/lib/cube/cube';
import { isoDiagram, lastLayerDiagram, type CubeDiagramSpec } from '@/lib/cube/diagram';

import { IsoCubeSvg, TopViewSvg } from './svg';

export type { CubeDiagramSpec };

/** A cube picture for lessons and the notation guide, computed with the cube model. */
export const CubeDiagram = memo(function CubeDiagram({
  spec,
  size = 120,
  accessibilityLabel,
}: {
  spec: CubeDiagramSpec;
  size?: number;
  accessibilityLabel: string;
}) {
  const { setup, solvedBy, show, view, highlightMove } = spec;
  const diagram = useMemo(() => {
    const state = solvedBy
      ? caseFromAlgorithm(solvedBy)
      : applyAlgorithm(solvedCube(), setup ?? '');
    if (view === 'top' || view === 'top-oll') {
      return { kind: 'top', ...lastLayerDiagram(state, view === 'top' ? 'pll' : 'oll') } as const;
    }
    return {
      kind: 'iso',
      ...isoDiagram(state, show, highlightMove ? moveLayer(highlightMove) : undefined),
    } as const;
  }, [setup, solvedBy, show, view, highlightMove]);

  return diagram.kind === 'top' ? (
    <TopViewSvg diagram={diagram} size={size} accessibilityLabel={accessibilityLabel} />
  ) : (
    <IsoCubeSvg diagram={diagram} size={size} accessibilityLabel={accessibilityLabel} />
  );
});
