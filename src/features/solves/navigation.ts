import { router } from 'expo-router';

export function openSolve(solveId: string): void {
  router.push({ pathname: '/solve/[solveId]', params: { solveId } });
}
