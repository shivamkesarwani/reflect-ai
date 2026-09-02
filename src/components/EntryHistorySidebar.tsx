import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  BookOpen, 
  Calendar, 
  Sparkles,
  MessageSquare,
  ChevronRight,
  Filter
} from 'lucide-react';
import { JournalEntry } from '../types';

interface EntryHistorySidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const EntryHistorySidebar: React.FC<EntryHistorySidebarProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = ['All', 'Mindfulness', 'Gratitude', 'Decisions', 'Ideas', 'General'];

  // Filter entries by search term and category
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      (entry.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (entry.summary?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (entry.keyThemes || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.messages.some((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' ||
      entry.category === selectedCategory ||
      (entry.keyThemes || []).some((t) => t.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await onDeleteEntry(entryId);
      setEntryToDelete(null);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#e8eada] border-r border-[#d9d9ce] w-full sm:w-80 md:w-96 select-none transition-colors">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-[#d9d9ce]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#6b725c]" />
            <h2 className="font-serif font-semibold text-[#2d3224] text-base tracking-tight">
              Past Reflections
            </h2>
            <span className="text-[11px] bg-[#dfe2cf] text-[#3d4234] px-2 py-0.5 rounded-full font-medium border border-[#d9d9ce]">
              {entries.length}
            </span>
          </div>

          <button
            id="sidebar-new-entry-btn"
            onClick={() => {
              onNewEntry();
              onCloseMobile();
            }}
            className="flex items-center gap-1 text-xs font-semibold bg-[#8c967a] text-white hover:bg-[#7b8569] px-3 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8c967a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-reflections-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reflections, insights..."
            className="w-full text-xs pl-8.5 pr-3 py-2 bg-[#f5f5f0] border border-[#d9d9ce] rounded-xl text-[#2d3224] placeholder-[#8c967a] focus:outline-hidden focus:ring-1 focus:ring-[#8c967a] focus:border-[#8c967a] transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-0.5 scrollbar-none text-[11px]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#8c967a] text-white font-medium shadow-xs'
                  : 'bg-[#f5f5f0] text-[#515744] border border-[#d9d9ce] hover:bg-[#dfe2cf]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <p className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#6b725c]">
          Recent Reflections
        </p>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#dfe2cf] flex items-center justify-center text-[#6b725c] mb-3 border border-[#d9d9ce]">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-sm font-serif font-medium text-[#2d3224] mb-1">
              {searchTerm ? 'No matching reflections' : 'No reflections yet'}
            </p>
            <p className="text-xs text-[#6b725c] max-w-xs mx-auto mb-4 leading-relaxed">
              {searchTerm
                ? 'Try different keywords or clear the category filter.'
                : 'Start your first guided reflection session with Gemini.'}
            </p>
            {!searchTerm && (
              <button
                id="empty-state-new-entry-btn"
                onClick={() => {
                  onNewEntry();
                  onCloseMobile();
                }}
                className="text-xs font-semibold text-[#2d3224] bg-white border border-[#d9d9ce] hover:bg-[#f5f5f0] px-4 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
              >
                Begin First Reflection
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isActive = activeEntryId === entry.id;
            const snippet =
              entry.summary ||
              entry.messages[entry.messages.length - 1]?.text ||
              'Fresh reflection draft...';

            return (
              <div
                key={entry.id}
                id={`entry-item-${entry.id}`}
                onClick={() => {
                  onSelectEntry(entry);
                  onCloseMobile();
                }}
                className={`group relative p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#f5f5f0] shadow-sm border border-[#d9d9ce]'
                    : 'border border-transparent hover:bg-[#dfe2cf]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-[#2d3224] line-clamp-1 leading-snug">
                    {entry.title || 'Untitled Reflection'}
                  </h3>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {entryToDelete === entry.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded border border-red-200">
                        <button
                          onClick={(e) => handleDelete(e, entry.id)}
                          disabled={isDeleting}
                          className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded hover:bg-red-700 font-medium cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEntryToDelete(null);
                          }}
                          className="text-[10px] text-[#515744] px-1 py-0.5 hover:bg-[#dfe2cf] rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntryToDelete(entry.id);
                        }}
                        className="p-1 text-[#8c967a] hover:text-red-700 rounded hover:bg-white/60 transition-colors cursor-pointer"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#515744] line-clamp-2 leading-relaxed mb-2 font-normal">
                  {snippet}
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#8c967a] pt-1.5 border-t border-[#d9d9ce]/60">
                  <span className="flex items-center gap-1 text-[#8c967a]">
                    <Calendar className="w-3 h-3" />
                    {formatDate(entry.updatedAt || entry.createdAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    {entry.summary && (
                      <span className="flex items-center gap-0.5 text-[#6b725c] font-medium" title="Has AI Synthesis">
                        <Sparkles className="w-3 h-3 text-[#8c967a]" />
                        <span>Insight</span>
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[#8c967a]">
                      <MessageSquare className="w-3 h-3" />
                      {entry.messages.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block shrink-0 h-[calc(100vh-65px)] sticky top-[65px]">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop and panel */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#2d3224]/30 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 w-80 max-w-[85vw] h-full shadow-xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
