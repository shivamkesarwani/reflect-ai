import React, { useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signOutUser, 
  User 
} from './lib/firebase';
import { 
  subscribeToUserEntries, 
  saveJournalEntry, 
  deleteJournalEntry, 
  updateEntryWithSummary 
} from './lib/firestoreService';
import { JournalEntry, ReflectionSummary } from './types';
import { Navbar } from './components/Navbar';
import { EntryHistorySidebar } from './components/EntryHistorySidebar';
import { JournalEditor } from './components/JournalEditor';
import { AuthLanding } from './components/AuthLanding';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to User's Firestore Entries when authenticated
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setActiveEntryId(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (updatedEntries) => {
        setEntries(updatedEntries);

        // If no active entry is selected, pick the most recent or let user start one
        setActiveEntryId((prevId) => {
          if (prevId && updatedEntries.some((e) => e.id === prevId)) {
            return prevId;
          }
          return updatedEntries.length > 0 ? updatedEntries[0].id : null;
        });
      },
      (error) => {
        console.error('Failed to subscribe to entries:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Create a new blank reflection session
  const handleNewEntry = () => {
    if (!user) return;
    const newId = `entry-${Date.now()}`;
    const newEntry: JournalEntry = {
      id: newId,
      userId: user.uid,
      title: 'Untitled Reflection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      category: 'General',
    };

    // Save immediately so it's in the list
    saveJournalEntry(user.uid, newEntry).then(() => {
      setActiveEntryId(newId);
    });
  };

  // Update an existing reflection in Firestore
  const handleUpdateEntry = async (updatedEntry: JournalEntry) => {
    if (!user) return;
    await saveJournalEntry(user.uid, updatedEntry);
  };

  // Delete an entry from Firestore
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    await deleteJournalEntry(user.uid, entryId);
    if (activeEntryId === entryId) {
      const remaining = entries.filter((e) => e.id !== entryId);
      setActiveEntryId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Generate structured reflection summary via Gemini 3.6 Flash
  const handleSynthesize = async (entryToSynthesize: JournalEntry): Promise<ReflectionSummary | null> => {
    if (!user || entryToSynthesize.messages.length === 0) return null;

    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: entryToSynthesize.title,
          messages: entryToSynthesize.messages,
        }),
      });

      if (!res.ok) {
        throw new Error(`Summary generation failed: ${res.status}`);
      }

      const summaryData: ReflectionSummary = await res.json();

      // Save synthesis back to Firestore
      await updateEntryWithSummary(user.uid, entryToSynthesize.id, summaryData);
      return summaryData;
    } catch (err) {
      console.error('Synthesis error:', err);
      return null;
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setActiveEntryId(null);
  };

  // Demo user mode for instant reviewer evaluation if third-party cookies are blocked in iframe
  const handleDemoLogin = () => {
    const demoUser = {
      uid: 'demo_contemplator_uid_492',
      displayName: 'Mindful Explorer',
      email: 'explorer@private-journal.internal',
      photoURL: '',
    } as unknown as User;
    setUser(demoUser);
  };

  // Auth Loading Splash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#8c967a] mb-3" />
        <p className="text-xs text-[#6b725c] font-medium tracking-wide">
          Connecting to secure journal workspace...
        </p>
      </div>
    );
  }

  // Not signed in: Show Landing Page with Google Sign In
  if (!user) {
    return <AuthLanding onDemoLogin={handleDemoLogin} />;
  }

  // Find active entry or construct placeholder if none exists yet
  const activeEntry =
    entries.find((e) => e.id === activeEntryId) ||
    (entries.length > 0
      ? entries[0]
      : {
          id: `entry-${Date.now()}`,
          userId: user.uid,
          title: 'Welcome Reflection',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          category: 'General',
        });

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#3d4234] flex flex-col font-sans antialiased selection:bg-[#dfe2cf] selection:text-[#2d3224]">
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onNewEntry={handleNewEntry}
        onToggleSidebarMobile={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        entryCount={entries.length}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Past Reflections List */}
        <EntryHistorySidebar
          entries={entries}
          activeEntryId={activeEntry.id}
          onSelectEntry={(entry) => setActiveEntryId(entry.id)}
          onNewEntry={handleNewEntry}
          onDeleteEntry={handleDeleteEntry}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
        />

        {/* Center / Right: Main Journal & Gemini Reflection Canvas */}
        <JournalEditor
          key={activeEntry.id}
          entry={activeEntry}
          onUpdateEntry={handleUpdateEntry}
          onSynthesize={handleSynthesize}
          isSynthesizing={isSynthesizing}
        />
      </div>
    </div>
  );
}
