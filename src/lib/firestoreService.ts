import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { JournalEntry, ReflectionSummary } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Local storage helpers for demo mode when Firebase Auth is not active
const DEMO_STORAGE_KEY = 'aura_demo_reflections';

function getDemoEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveDemoEntries(entries: JournalEntry[]): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save to local demo storage:', err);
  }
}

const demoListeners = new Set<(entries: JournalEntry[]) => void>();

function notifyDemoListeners(): void {
  const entries = getDemoEntries();
  demoListeners.forEach((listener) => listener(entries));
}

function isDemoMode(userId: string): boolean {
  return userId.startsWith('demo_') || !auth.currentUser;
}

/**
 * Real-time listener for user's journal entries.
 * Uses Firestore for authenticated users, local storage for demo preview.
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (isDemoMode(userId)) {
    // Deliver initial demo data
    onUpdate(getDemoEntries());
    demoListeners.add(onUpdate);
    return () => {
      demoListeners.delete(onUpdate);
    };
  }

  const path = `users/${userId}/entries`;
  const userEntriesRef = collection(db, 'users', userId, 'entries');
  const q = query(userEntriesRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || 'Untitled Reflection',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          messages: data.messages || [],
          summary: data.summary,
          keyThemes: data.keyThemes || [],
          actionableTakeaways: data.actionableTakeaways || [],
          sentiment: data.sentiment,
          category: data.category,
        });
      });
      onUpdate(entries);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

/**
 * Save or update a journal entry in Firestore
 */
export async function saveJournalEntry(
  userId: string,
  entry: JournalEntry
): Promise<void> {
  if (!userId) throw new Error('User ID is required to persist entry');

  const now = new Date().toISOString();
  const dataToSave: JournalEntry = {
    id: entry.id,
    userId: userId,
    title: entry.title || 'Untitled Reflection',
    createdAt: entry.createdAt || now,
    updatedAt: now,
    messages: entry.messages || [],
    ...(entry.summary ? { summary: entry.summary } : {}),
    ...(entry.keyThemes ? { keyThemes: entry.keyThemes } : {}),
    ...(entry.actionableTakeaways ? { actionableTakeaways: entry.actionableTakeaways } : {}),
    ...(entry.sentiment ? { sentiment: entry.sentiment } : {}),
    ...(entry.category ? { category: entry.category } : {}),
  };

  if (isDemoMode(userId)) {
    const list = getDemoEntries();
    const idx = list.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      list[idx] = dataToSave;
    } else {
      list.unshift(dataToSave);
    }
    saveDemoEntries(list);
    notifyDemoListeners();
    return;
  }

  const path = `users/${userId}/entries/${entry.id}`;
  try {
    const entryDocRef = doc(db, 'users', userId, 'entries', entry.id);
    await setDoc(entryDocRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a user's journal entry from Firestore
 */
export async function deleteJournalEntry(
  userId: string,
  entryId: string
): Promise<void> {
  if (!userId || !entryId) return;

  if (isDemoMode(userId)) {
    const list = getDemoEntries().filter((e) => e.id !== entryId);
    saveDemoEntries(list);
    notifyDemoListeners();
    return;
  }

  const path = `users/${userId}/entries/${entryId}`;
  try {
    const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(entryDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save structured AI reflection summary to the entry
 */
export async function updateEntryWithSummary(
  userId: string,
  entryId: string,
  summaryData: ReflectionSummary
): Promise<void> {
  if (!userId || !entryId) return;

  const now = new Date().toISOString();
  if (isDemoMode(userId)) {
    const list = getDemoEntries();
    const entry = list.find((e) => e.id === entryId);
    if (entry) {
      entry.updatedAt = now;
      entry.summary = summaryData.summary;
      entry.keyThemes = summaryData.keyThemes;
      entry.actionableTakeaways = summaryData.actionableTakeaways;
      if (summaryData.sentiment) entry.sentiment = summaryData.sentiment;
      if (summaryData.title) entry.title = summaryData.title;
      saveDemoEntries(list);
      notifyDemoListeners();
    }
    return;
  }

  const path = `users/${userId}/entries/${entryId}`;
  try {
    const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
    const updatePayload: Record<string, unknown> = {
      updatedAt: now,
      summary: summaryData.summary,
      keyThemes: summaryData.keyThemes,
      actionableTakeaways: summaryData.actionableTakeaways,
      ...(summaryData.sentiment ? { sentiment: summaryData.sentiment } : {}),
    };

    if (summaryData.title) {
      updatePayload.title = summaryData.title;
    }

    await setDoc(entryDocRef, updatePayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
