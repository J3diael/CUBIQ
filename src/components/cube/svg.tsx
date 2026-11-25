import Svg, { Polygon, Rect } from 'react-native-svg';

import type { DiagramColor, IsoDiagram, LastLayerDiagram } from '@/lib/cube/diagram';
import type { Face } from '@/lib/cube/notation';
import { useTheme } from '@/theme';

/** Standard colour scheme: yellow top, green front, white bottom. Same in both themes. */
export const CUBE_COLORS: Record<Face, string> = {
  U: '#FFD500',
  D: '#FFFFFF',
  F: '#00A35C',
  B: '#1F5BD8',
  R: '#D7263D',
  L: '#FF7A00',
};

function usePalette() {
  const theme = useTheme();
  const grey = theme.scheme === 'dark' ? '#3B3B46' : '#C9C9D2';
  const stroke = theme.scheme === 'dark' ? '#0B0B0F' : '#2A2A33';
  return { stroke, fill: (c: DiagramColor) => (c ? CUBE_COLORS[c] : grey) };
}

interface SvgProps {
  size: number;
  accessibilityLabel: string;
}

/** Top face with a thin strip for each side's top row: the usual OLL/PLL picture. */
export function TopViewSvg({
  diagram,
  size,
  accessibilityLabel,
}: SvgProps & { diagram: LastLayerDiagram }) {
  const { fill, stroke } = usePalette();
  const unit = 10;
  const strip = 3;
  const gap = 1;
  const total = 3 * unit + 2 * (strip + gap);
  const o = strip + gap;
  const cells = diagram.top.map((c, i) => (
    <Rect
      key={`t${i}`}
      x={o + (i % 3) * unit}
      y={o + Math.floor(i / 3) * unit}
      width={unit}
      height={unit}
      rx={1.2}
      fill={fill(c)}
      stroke={stroke}
      strokeWidth={0.8}
    />
  ));
  // Back strip is read right-to-left from above, left strip back-to-front.
  const sides = [
    ...diagram.front.map((c, i) => ({
      c,
      x: o + i * unit,
      y: o + 3 * unit + gap,
      w: unit,
      h: strip,
    })),
    ...diagram.back.map((c, i) => ({ c, x: o + (2 - i) * unit, y: 0, w: unit, h: strip })),
    ...diagram.right.map((c, i) => ({
      c,
      x: o + 3 * unit + gap,
      y: o + (2 - i) * unit,
      w: strip,
      h: unit,
    })),
    ...diagram.left.map((c, i) => ({ c, x: 0, y: o + i * unit, w: strip, h: unit })),
  ].map((s, i) => (
    <Rect
      key={`s${i}`}
      x={s.x}
      y={s.y}
      width={s.w}
      height={s.h}
      rx={0.8}
      fill={fill(s.c)}
      stroke={stroke}
      strokeWidth={0.6}
    />
  ));
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      {cells}
      {sides}
    </Svg>
  );
}

/** Isometric cube showing the top, front and right faces. */
export function IsoCubeSvg({
  diagram,
  size,
  accessibilityLabel,
}: SvgProps & { diagram: IsoDiagram }) {
  const { fill, stroke } = usePalette();
  const cos = Math.cos(Math.PI / 6);
  const sin = Math.sin(Math.PI / 6);
  const project = (x: number, y: number, z: number) => [(x - z) * cos, (x + z) * sin - y];
  const quad = (corners: [number, number, number][]) =>
    corners.map(([x, y, z]) => project(x, y, z).join(',')).join(' ');
  const inset = 0.46;
  const polys: { key: string; points: string; color: DiagramColor; faded: boolean }[] = [];
  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 3);
    const c = i % 3;
    const u = { x: c - 1, z: r - 1 };
    polys.push({
      key: `u${i}`,
      color: diagram.U[i] ?? null,
      faded: diagram.faded?.U[i] ?? false,
      points: quad([
        [u.x - inset, 1.5, u.z - inset],
        [u.x + inset, 1.5, u.z - inset],
        [u.x + inset, 1.5, u.z + inset],
        [u.x - inset, 1.5, u.z + inset],
      ]),
    });
    const f = { x: c - 1, y: 1 - r };
    polys.push({
      key: `f${i}`,
      color: diagram.F[i] ?? null,
      faded: diagram.faded?.F[i] ?? false,
      points: quad([
        [f.x - inset, f.y + inset, 1.5],
        [f.x + inset, f.y + inset, 1.5],
        [f.x + inset, f.y - inset, 1.5],
        [f.x - inset, f.y - inset, 1.5],
      ]),
    });
    const rr = { z: 1 - c, y: 1 - r };
    polys.push({
      key: `r${i}`,
      color: diagram.R[i] ?? null,
      faded: diagram.faded?.R[i] ?? false,
      points: quad([
        [1.5, rr.y + inset, rr.z + inset],
        [1.5, rr.y + inset, rr.z - inset],
        [1.5, rr.y - inset, rr.z - inset],
        [1.5, rr.y - inset, rr.z + inset],
      ]),
    });
  }
  // Projected corners reach ±2.6 across and ±3 down, so a 6.2 square fits the cube.
  return (
    <Svg
      width={size}
      height={size}
      viewBox="-3.1 -3.1 6.2 6.2"
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      {polys.map((p) => (
        <Polygon
          key={p.key}
          points={p.points}
          fill={fill(p.color)}
          fillOpacity={p.faded ? 0.25 : 1}
          stroke={stroke}
          strokeWidth={0.06}
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
