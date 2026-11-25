import { memo, useMemo } from 'react';

import { caseDiagram } from '@/lib/cube/diagram';

import { IsoCubeSvg, TopViewSvg } from './svg';

interface CaseDiagramProps {
  algorithm: string;
  set: 'f2l' | 'oll' | 'pll' | 'other';
  size?: number;
  /** Read by screen readers, e.g. "PLL T case". */
  accessibilityLabel: string;
}

/**
 * Draws the case an algorithm solves. The picture comes from running the algorithm
 * backwards on a solved cube, so diagram and algorithm always match.
 */
export const CaseDiagram = memo(function CaseDiagram({
  algorithm,
  set,
  size = 96,
  accessibilityLabel,
}: CaseDiagramProps) {
  const diagram = useMemo(() => caseDiagram(algorithm, set), [algorithm, set]);
  return diagram.kind === 'last-layer' ? (
    <TopViewSvg diagram={diagram} size={size} accessibilityLabel={accessibilityLabel} />
  ) : (
    <IsoCubeSvg diagram={diagram} size={size} accessibilityLabel={accessibilityLabel} />
  );
});
