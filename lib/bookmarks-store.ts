'use client';

export type BookmarkKind = 'screenshots' | 'icon';
export type Bookmark = { id: string; appId: string; kind: BookmarkKind; savedAt: number };

const DB_NAME = 'screeny';
const STORE = 'bookmarks';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const bookmarkKey = (kind: BookmarkKind, appId: string) => `${kind}:${appId}`;

export const listBookmarks = () => run<Bookmark[]>('readonly', (s) => s.getAll());
export const addBookmark = (b: Bookmark) => run('readwrite', (s) => s.put(b));
export const removeBookmark = (id: string) => run('readwrite', (s) => s.delete(id));
