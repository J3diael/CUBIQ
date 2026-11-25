// Every test starts with a fresh, migrated SQLite database (better-sqlite3 in memory)
// and stores loaded from it, the same way the app starts.
import { setDatabase } from '@/database/client';
import { createTestDatabase } from '@/database/test-utils';
import { loadAppData } from '@/features/bootstrap/load-app-data';
import { useUiStore } from '@/store/ui-store';

let closeDatabase: (() => void) | null = null;

beforeEach(() => {
  const { db, close } = createTestDatabase();
  closeDatabase = close;
  setDatabase(db);
  loadAppData();
  useUiStore.setState({ timerFocusMode: false, toast: null });
});

afterEach(() => {
  setDatabase(null);
  closeDatabase?.();
  closeDatabase = null;
});
