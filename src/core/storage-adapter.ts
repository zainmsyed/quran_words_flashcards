export interface StorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const browserStorage: StorageAdapter = {
  async getItem(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  },
  async setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  async removeItem(key) {
    localStorage.removeItem(key);
  }
};
