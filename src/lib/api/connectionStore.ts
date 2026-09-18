import * as SecureStore from 'expo-secure-store';
import { ApiConfig } from './client';

const KEY = 'ci_wp_connection';

export async function loadConnection(): Promise<ApiConfig | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.siteUrl && parsed.username && parsed.appPassword) {
      return parsed as ApiConfig;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Best-effort: if secure storage isn't available on this platform (e.g. web),
 * the connection still works for the current session, it just won't be
 * remembered next launch.
 */
export async function saveConnection(config: ApiConfig): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(config));
  } catch {
    // ignore — see note above
  }
}

export async function clearConnection(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}
