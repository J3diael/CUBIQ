import { useCallback, useEffect, useState } from 'react';

import { openDatabase } from '@/database/open';

import { loadAppData } from './load-app-data';

export type BootstrapState =
  { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

/**
 * Opens the database, applies migrations and loads saved data before the app shows.
 * On failure the app shows an error screen with a retry instead of running without storage.
 */
export function useAppBootstrap() {
  const [state, setState] = useState<BootstrapState>({ status: 'loading' });

  const start = useCallback(() => {
    openDatabase()
      .then(() => {
        loadAppData();
        setState({ status: 'ready' });
      })
      .catch((error: unknown) => {
        console.error('Startup failed', error);
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      });
  }, []);

  useEffect(() => {
    start();
  }, [start]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    start();
  }, [start]);

  return { state, retry };
}
