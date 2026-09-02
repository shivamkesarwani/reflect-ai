import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Database, 
  Cpu, 
  ExternalLink,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthLandingProps {
  onDemoLogin?: () => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ onDemoLogin }) => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      // On success, Firebase onAuthStateChanged will automatically trigger in App.tsx
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Sign-in failed';
      
      if (errorMsg.includes('popup-blocked') || errorMsg.includes('popup-closed-by-user')) {
        setAuthError(
          'The sign-in popup was blocked or closed. Please allow popups for this site, or open this application in a new browser tab.'
        );
      } else {
        setAuthError(
          `Authentication note: ${errorMsg}. If third-party cookies or popups are restricted in the iframe preview, try opening in a new tab or test with Guest Access.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#3d4234] flex flex-col justify-between selection:bg-[#dfe2cf] selection:text-[#2d3224] transition-colors">
      {/* Top minimal header */}
      <header className="px-6 py-4 border-b border-[#d9d9ce] bg-[#e8eada]/80 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#8c967a] text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-[#f5f5f0]" />
          </div>
          <span className="font-serif font-semibold text-[#2d3224] tracking-tight text-lg">
            Reflections
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#6b725c]">
          <ShieldCheck className="w-4 h-4 text-[#8c967a]" />
          <span className="hidden sm:inline font-medium">Encrypted & Isolated via Firestore</span>
        </div>
      </header>

      {/* Hero & Sign-in container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-[#d9d9ce] rounded-3xl p-8 sm:p-10 shadow-sm">
          {/* Logo & Headline */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#e8eada] border border-[#d9d9ce] text-[#8c967a] flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <BookOpen className="w-7 h-7 text-[#8c967a]" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2d3224] tracking-tight mb-2.5">
              Reflections & Journal
            </h1>
            <p className="text-xs text-[#6b725c] leading-relaxed max-w-sm mx-auto">
              A private contemplative space powered by Gemini. Unpack thoughts, discover insights, and synthesize mental clarity.
            </p>
          </div>

          {/* Error notice if popup was blocked */}
          {authError && (
            <div className="mb-6 p-4 bg-[#e8eada] border border-[#d9d9ce] rounded-2xl text-xs text-[#3d4234] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#8c967a] shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="leading-relaxed">{authError}</p>
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#2d3224] font-semibold hover:underline"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {onDemoLogin && (
                    <button
                      onClick={onDemoLogin}
                      className="text-[#6b725c] font-semibold underline hover:text-[#2d3224] cursor-pointer"
                    >
                      Continue in guest mode
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Primary Action: Google Sign In */}
          <div className="space-y-3">
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[#8c967a] hover:bg-[#7b8569] text-white font-semibold text-sm rounded-full transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {/* Google G SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ffffff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#ffffff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#ffffff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
            </button>

            {/* Optional Guest fallback for instant evaluation */}
            {onDemoLogin && (
              <button
                id="guest-demo-login-btn"
                onClick={onDemoLogin}
                className="w-full text-center py-2.5 px-4 text-xs font-semibold text-[#6b725c] hover:text-[#2d3224] border border-[#d9d9ce] hover:bg-[#e8eada] rounded-full transition-colors cursor-pointer"
              >
                Quick Preview as Demo User
              </button>
            )}
          </div>

          {/* Privacy & Architecture Guarantee */}
          <div className="mt-8 pt-6 border-t border-[#d9d9ce]">
            <div className="space-y-3 text-xs text-[#515744]">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#8c967a] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#2d3224]">Strict User Isolation:</strong> Authenticated sessions write exclusively to <code className="text-[11px] bg-[#f5f5f0] text-[#2d3224] px-1.5 py-0.5 rounded-md font-mono border border-[#d9d9ce]">/users/{'{uid}'}/entries</code> enforced by Firestore Security Rules.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Cpu className="w-4 h-4 text-[#8c967a] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#2d3224]">Gemini 3.6 Flash Engine:</strong> Multi-turn reflective dialogue, automatic key themes extraction, and growth takeaways.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Database className="w-4 h-4 text-[#8c967a] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#2d3224]">Cloud Persistence:</strong> Real-time syncing ensures your journal entries are safely preserved across devices.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#8c967a] border-t border-[#d9d9ce] bg-[#e8eada]/50">
        Private Journal & Reflection System • Powered by Google AI Studio, Gemini 3.6 Flash & Cloud Firestore
      </footer>
    </div>
  );
};
