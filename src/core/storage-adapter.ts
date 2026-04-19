export interface StorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function warnStorageFailure(action: 'write' | 'remove', key: string, error?: unknown) {
  const suffix = error instanceof Error ? `: ${error.message}` : '';
  console.warn(`[storage] Failed to ${action} "${key}"${suffix}`);
}

export const browserStorage: StorageAdapter = {
  async getItem(key) {
    try {
      const storage = getLocalStorage();
      if (!storage) return null;
      const v = storage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      const storage = getLocalStorage();
      if (storage) {
        try {
          storage.removeItem(key);
        } catch {
          // ignore read cleanup failures
        }
      }
      return null;
    }
  },
  async setItem(key, value) {
    const storage = getLocalStorage();
    if (!storage) {
      warnStorageFailure('write', key);
      return;
    }

    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      try {
        storage.removeItem(key);
      } catch (removeError) {
        warnStorageFailure('remove', key, removeError);
      }
      warnStorageFailure('write', key, error);
    }
  },
  async removeItem(key) {
    const storage = getLocalStorage();
    if (!storage) {
      warnStorageFailure('remove', key);
      return;
    }

    try {
      storage.removeItem(key);
    } catch (error) {
      try {
        storage.setItem(key, 'null');
      } catch (writeError) {
        warnStorageFailure('write', key, writeError);
      }
      warnStorageFailure('remove', key, error);
    }
  }
};
