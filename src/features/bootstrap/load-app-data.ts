import { useDataStore } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';

/** Fills the stores from the open database. Tests call it after registering a test database. */
export function loadAppData(): void {
  useSettingsStore.getState().hydrate();
  useDataStore.getState().load();
}
