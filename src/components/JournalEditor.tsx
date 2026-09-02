import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  CloudCheck, 
  Lightbulb, 
  Bot, 
  User as UserIcon, 
  CornerDownLeft,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { JournalEntry, ChatMessage, JournalPrompt, ReflectionSummary } from '../types';
import { SummaryCard } from './SummaryCard';

interface JournalEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => Promise<void>;
  onSynthesize: (entry: JournalEntry) => Promise<ReflectionSummary | null>;
  isSynthesizing: boolean;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onUpdateEntry,
  onSynthesize,
  isSynthesizing,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [showPrompts, setShowPrompts] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [currentTitle, setCurrentTitle] = useState(entry.title || '');
  const [currentCategory, setCurrentCategory] = useState(entry.category || 'General');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when active entry changes
  useEffect(() => {
    setCurrentTitle(entry.title || '');
    setCurrentCategory(entry.category || 'General');
    setInputText('');
  }, [entry.id]);

  // Fetch contextual prompts on load
  useEffect(() => {
    fetch('/api/prompts')
      .then((res) => res.json())
      .then((data) => {
        if (data.prompts && Array.isArray(data.prompts)) {
          setPrompts(data.prompts);
        }
      })
      .catch((err) => console.error('Error fetching prompts:', err));
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages.length, isSending]);

  // Handle Title Blur or change
  const handleTitleBlur = async () => {
    if (currentTitle !== entry.title) {
      setSaveStatus('saving');
      try {
        await onUpdateEntry({
          ...entry,
          title: currentTitle.trim() || 'Untitled Reflection',
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }
  };

  // Handle Category Change
  const handleCategorySelect = async (cat: string) => {
    setCurrentCategory(cat);
    setSaveStatus('saving');
    try {
      await onUpdateEntry({
        ...entry,
        category: cat,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  // Send message to Gemini and append multi-turn interaction
  const handleSendMessage = async (customContent?: string) => {
    const textToSend = (customContent !== undefined ? customContent : inputText).trim();
    if (!textToSend || isSending) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      text: textToSend,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...entry.messages, userMessage];

    // Optimistically update entry with user message
    const updatedEntry: JournalEntry = {
      ...entry,
      title: entry.title === 'Untitled Reflection' || !entry.title
        ? textToSend.slice(0, 40) + (textToSend.length > 40 ? '...' : '')
        : entry.title,
      category: currentCategory,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    setInputText('');
    setIsSending(true);
    setSaveStatus('saving');

    try {
      // Save user turn to Firestore immediately
      await onUpdateEntry(updatedEntry);

      // Call Gemini API through backend
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const modelReplyText = data.text || 'Thank you for sharing that reflection.';

      const modelMessage: ChatMessage = {
        id: `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'model',
        text: modelReplyText,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, modelMessage];
      const finalizedEntry: JournalEntry = {
        ...updatedEntry,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };

      // Persist full multi-turn conversation back to Firestore
      await onUpdateEntry(finalizedEntry);
      setSaveStatus('saved');
    } catch (err: unknown) {
      console.error('Failed to converse with Gemini:', err);
      setSaveStatus('error');
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplyPrompt = (prompt: JournalPrompt) => {
    setInputText(prompt.starterThought || prompt.prompt);
    setShowPrompts(false);
    textareaRef.current?.focus();
  };

  const categories = ['General', 'Mindfulness', 'Gratitude', 'Decisions', 'Ideas', 'Emotional Processing'];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] bg-[#f5f5f0] overflow-hidden transition-colors">
      {/* Editor Header */}
      <div className="px-6 sm:px-8 py-5 border-b border-[#d9d9ce] bg-[#f5f5f0]/95 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <input
            id="journal-title-input"
            type="text"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Name your reflection..."
            className="w-full font-serif text-2xl sm:text-3xl font-semibold text-[#2d3224] placeholder-[#a5a995] border-none bg-transparent p-0 focus:outline-hidden focus:ring-0 leading-tight"
          />

          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-[#6b725c]">
              <span className="font-medium">Theme:</span>
              <select
                id="journal-category-select"
                value={currentCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="bg-[#e8eada] hover:bg-[#dfe2cf] border border-[#d9d9ce] text-[#2d3224] text-xs rounded-full px-3 py-0.5 focus:outline-hidden cursor-pointer font-medium"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-3 w-px bg-[#d9d9ce]" />

            <div className="flex items-center gap-1.5 text-xs text-[#8c967a]">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-[#6b725c]">
                  <Loader2 className="w-3 h-3 animate-spin text-[#8c967a]" />
                  <span>Saving to Firestore...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-[#6b725c] font-medium">
                  <CloudCheck className="w-3.5 h-3.5 text-[#8c967a]" />
                  <span>Stored securely</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-600 font-medium">Auto-save notice</span>
              )}
            </div>
          </div>
        </div>

        {/* Action button: Synthesize */}
        {entry.messages.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="synthesize-reflection-btn"
              onClick={() => onSynthesize(entry)}
              disabled={isSynthesizing || isSending}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-[#e8eada] text-[#2d3224] border border-[#d9d9ce] px-4 py-2 rounded-full transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSynthesizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8c967a]" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#8c967a]" />
              )}
              <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize Insights'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: Scrollable conversation + Summary */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Gemini Reflection Summary Card if available */}
        {entry.summary && (
          <SummaryCard
            summary={{
              title: entry.title,
              summary: entry.summary,
              keyThemes: entry.keyThemes || [],
              actionableTakeaways: entry.actionableTakeaways || [],
              sentiment: entry.sentiment,
            }}
            isGenerating={isSynthesizing}
            onRefresh={() => onSynthesize(entry)}
          />
        )}

        {/* Thought Starter Prompts Carousel (when entry has few messages) */}
        {entry.messages.length <= 1 && prompts.length > 0 && showPrompts && (
          <div
            id="prompt-suggestions-box"
            className="bg-[#e8eada]/70 border border-[#d9d9ce] rounded-2xl p-4 sm:p-5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6b725c]">
                <Lightbulb className="w-4 h-4 text-[#8c967a]" />
                <span>Today's Reflection Prompts</span>
              </div>
              <button
                onClick={() => setShowPrompts(false)}
                className="text-xs text-[#8c967a] hover:text-[#2d3224] cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prompts.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleApplyPrompt(p)}
                  className="p-3.5 text-left bg-white hover:bg-[#f5f5f0] border border-[#d9d9ce] rounded-xl text-[#3d4234] transition-colors group cursor-pointer shadow-2xs"
                >
                  <span className="inline-block text-[10px] font-bold text-[#8c967a] uppercase tracking-wider mb-1">
                    {p.category}
                  </span>
                  <p className="text-xs font-semibold text-[#2d3224] line-clamp-2 leading-relaxed">
                    {p.prompt}
                  </p>
                  <p className="text-[11px] text-[#8c967a] mt-1 italic line-clamp-1">
                    "{p.starterThought}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state instruction when no messages */}
        {entry.messages.length === 0 && (
          <div className="text-center py-10 px-4 max-w-md mx-auto">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#e8eada] text-[#8c967a] flex items-center justify-center mb-3 border border-[#d9d9ce] shadow-xs">
              <Sparkles className="w-6 h-6 text-[#8c967a]" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-[#2d3224] mb-1.5">
              Your Private Reflection Canvas
            </h3>
            <p className="text-xs text-[#6b725c] leading-relaxed">
              How is your mind feeling today? Write whatever is on your mind—challenges, celebrations, decisions, or unfiltered thoughts.
              Gemini will offer mindful reflections and inquiries.
            </p>
          </div>
        )}

        {/* Message Thread with Natural Tones bubbles */}
        <div className="space-y-6 max-w-3xl mx-auto">
          {entry.messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#8c967a] text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed transition-all shadow-sm ${
                    isUser
                      ? 'bg-[#8c967a] text-white rounded-tr-none shadow-md'
                      : 'bg-white text-[#515744] border border-[#e8eada] rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">
                    <span className={isUser ? 'text-white' : 'text-[#8c967a]'}>
                      {isUser ? 'Your Thought' : 'Gemini Reflection'}
                    </span>
                    <span className={isUser ? 'text-white/80' : 'text-[#8c967a]'}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {isUser ? (
                    <div className="whitespace-pre-wrap font-normal text-white leading-relaxed text-sm">
                      {message.text}
                    </div>
                  ) : (
                    <div className="markdown-body text-[#515744] leading-relaxed text-sm prose prose-stone max-w-none">
                      <Markdown>{message.text}</Markdown>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#dfe2cf] text-[#2d3224] flex items-center justify-center shrink-0 mt-1 border border-[#d9d9ce]">
                    <UserIcon className="w-4 h-4 text-[#6b725c]" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Gemini Generating Indicator */}
          {isSending && (
            <div className="flex gap-3 justify-start max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-[#8c967a] text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-[#e8eada] rounded-2xl rounded-tl-none p-4 text-xs text-[#515744] flex items-center gap-2 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#8c967a]" />
                <span>Gemini is reflecting on your thoughts...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Composer Styled with Natural Tones (rounded-3xl, ring-[#e8eada], focus ring-[#8c967a]) */}
      <footer className="p-4 sm:p-6 border-t border-[#d9d9ce] bg-[#f5f5f0] shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              id="reflection-input-textarea"
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                entry.messages.length === 0
                  ? "Write your reflection or ask Gemini a question..."
                  : "Reply to Gemini, elaborate on your feeling, or ask for guidance..."
              }
              rows={3}
              className="w-full resize-none rounded-3xl border-none bg-white p-5 pr-16 text-sm text-[#2d3224] placeholder-[#a5a995] shadow-inner ring-1 ring-[#e8eada] focus:outline-none focus:ring-2 focus:ring-[#8c967a] leading-relaxed transition-all"
            />

            <button
              id="send-reflection-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isSending}
              className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#8c967a] hover:bg-[#7b8569] text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Reflect (⌘/Ctrl + Enter)"
              aria-label="Send reflection"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="mt-2.5 text-center text-[10px] text-[#a5a995]">
            Your reflections are securely stored in Firestore and only accessible to you.
          </p>
        </div>
      </footer>
    </div>
  );
};
