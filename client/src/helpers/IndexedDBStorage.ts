import type { StateStorage } from "zustand/middleware";

const DB_NAME = "proxxied-storage";
const DB_VERSION = 1;
const STORE_NAME = "zustand-store";

class IndexedDBStorage implements StateStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });

    return this.dbPromise;
  }

  async getItem(name: string): Promise<string | null> {
    try {
      const db = await this.getDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(name);

        request.onsuccess = () => {
          resolve(request.result ?? null);
        };

        request.onerror = () => {
          reject(new Error("Failed to get item from IndexedDB"));
        };
      });
    } catch (error) {
      console.error("IndexedDB getItem error:", error);
      return null;
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    try {
      const db = await this.getDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, name);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error("Failed to set item in IndexedDB"));
        };
      });
    } catch (error) {
      console.error("IndexedDB setItem error:", error);
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      const db = await this.getDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(name);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error("Failed to remove item from IndexedDB"));
        };
      });
    } catch (error) {
      console.error("IndexedDB removeItem error:", error);
    }
  }
}

export const indexedDBStorage = new IndexedDBStorage();

/**
 * Migrate data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(storeName: string): Promise<void> {
  try {
    // Check if data exists in localStorage
    const localData = localStorage.getItem(storeName);
    if (!localData) {
      console.log("[Migration] No data found in localStorage for", storeName);
      return;
    }

    // Check if data already exists in IndexedDB
    const existingData = await indexedDBStorage.getItem(storeName);
    if (existingData) {
      console.log("[Migration] Data already exists in IndexedDB for", storeName);
      return;
    }

    // Migrate data to IndexedDB
    console.log("[Migration] Migrating data from localStorage to IndexedDB for", storeName);
    await indexedDBStorage.setItem(storeName, localData);

    // Remove old localStorage data
    localStorage.removeItem(storeName);

    console.log("[Migration] Successfully migrated", storeName, "to IndexedDB");
  } catch (error) {
    console.error("[Migration] Failed to migrate from localStorage:", error);
  }
}

/**
 * Clean up legacy localStorage keys
 */
export function cleanupLegacyStorage(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("proxxied:")) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(key => {
      console.log("[Cleanup] Removing legacy localStorage key:", key);
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("[Cleanup] Failed to cleanup legacy storage:", error);
  }
}
