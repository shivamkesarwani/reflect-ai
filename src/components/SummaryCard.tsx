import React from 'react';
import { Sparkles, Tag, CheckCircle2, RefreshCw } from 'lucide-react';
import { ReflectionSummary } from '../types';

interface SummaryCardProps {
  summary: ReflectionSummary;
  isGenerating?: boolean;
  onRefresh?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  isGenerating = false,
  onRefresh,
}) => {
  return (
    <div
      id="reflection-summary-card"
      className="bg-white border border-[#e8eada] rounded-2xl p-5 sm:p-6 mb-6 shadow-sm transition-all"
    >
      <div className="flex items-center justify-between pb-3.5 border-b border-[#e8eada] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#e8eada] text-[#8c967a]">
            <Sparkles className="w-4 h-4 text-[#8c967a]" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-[#2d3224] tracking-tight">
              Gemini Reflection Synthesis
            </h3>
            {summary.sentiment && (
              <span className="text-xs text-[#8c967a] font-medium">
                Tone: <span className="text-[#515744]">{summary.sentiment}</span>
              </span>
            )}
          </div>
        </div>

        {onRefresh && (
          <button
            id="refresh-summary-btn"
            onClick={onRefresh}
            disabled={isGenerating}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6b725c] hover:text-[#2d3224] px-3 py-1 rounded-full border border-[#d9d9ce] hover:bg-[#e8eada] transition-colors disabled:opacity-50 cursor-pointer"
            title="Re-analyze this entry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing...' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {/* Main summary paragraph */}
      <p className="text-sm text-[#515744] leading-relaxed font-normal mb-4">
        {summary.summary}
      </p>

      {/* Key themes chips */}
      {summary.keyThemes && summary.keyThemes.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8c967a] mb-2">
            <Tag className="w-3 h-3 text-[#8c967a]" />
            <span>Key Themes Identified</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {summary.keyThemes.map((theme, i) => (
              <span
                key={i}
                className="inline-flex items-center text-xs font-medium px-3 py-1 rounded-lg bg-[#f5f5f0] text-[#6b725c] border border-[#e8eada]"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Takeaways */}
      {summary.actionableTakeaways && summary.actionableTakeaways.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6b725c] mb-2">
            <CheckCircle2 className="w-3 h-3 text-[#8c967a]" />
            <span>Takeaways & Inquiries to Carry Forward</span>
          </div>
          <ul className="space-y-2">
            {summary.actionableTakeaways.map((point, idx) => (
              <li
                key={idx}
                className="text-xs text-[#515744] flex items-start gap-2.5 bg-[#f5f5f0] p-3 rounded-xl border border-[#e8eada]"
              >
                <span className="text-[#8c967a] font-mono text-sm leading-none mt-0.5">•</span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
