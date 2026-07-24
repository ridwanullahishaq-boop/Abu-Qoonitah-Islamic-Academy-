import React, { useState, useEffect, useRef } from "react";
import { Check, Save, RotateCcw, ShieldCheck, Clock, FileText, Trash2, HardDriveUpload } from "lucide-react";

/**
 * Hook to auto-save any state data to local vault / localStorage with debouncing.
 */
export function useAutoSave<T>(
  key: string,
  data: T,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
    onRestore?: (savedData: T) => void;
  }
) {
  const enabled = options?.enabled ?? true;
  const debounceMs = options?.debounceMs ?? 600;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const initialLoadRef = useRef(false);

  // Check if draft exists on initial load
  useEffect(() => {
    if (!key || !enabled) return;
    try {
      const stored = localStorage.getItem(`lms_autosave_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.data !== undefined && parsed.data !== null) {
          setHasDraft(true);
          if (parsed.timestamp) {
            const date = new Date(parsed.timestamp);
            setLastSavedTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          }
        }
      }
    } catch (e) {
      console.error("AutoSave load error:", e);
    }
  }, [key, enabled]);

  // Save data on changes (debounced)
  useEffect(() => {
    if (!key || !enabled) return;

    // Skip saving empty or default states on first render
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      return;
    }

    setIsSaving(true);
    const timer = setTimeout(() => {
      try {
        const timestamp = new Date().toISOString();
        localStorage.setItem(
          `lms_autosave_${key}`,
          JSON.stringify({ data, timestamp })
        );
        const date = new Date();
        setLastSavedTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setHasDraft(true);
        setIsSaving(false);
      } catch (e) {
        console.error("AutoSave write error:", e);
        setIsSaving(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [key, data, enabled, debounceMs]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(`lms_autosave_${key}`);
      setHasDraft(false);
      setLastSavedTime(null);
    } catch (e) {
      console.error("AutoSave clear error:", e);
    }
  };

  const loadDraft = (): T | null => {
    try {
      const stored = localStorage.getItem(`lms_autosave_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data ?? null;
      }
    } catch (e) {
      console.error("AutoSave restore error:", e);
    }
    return null;
  };

  return { isSaving, lastSavedTime, hasDraft, clearDraft, loadDraft };
}

/**
 * Top/Header Status Indicator for Auto-Saver
 */
export function AutoSaveBadge({
  isSaving,
  lastSavedTime,
  hasDraft,
  onClear,
  label = "Auto-Saver Active"
}: {
  isSaving?: boolean;
  lastSavedTime?: string | null;
  hasDraft?: boolean;
  onClear?: () => void;
  label?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-900/10 dark:bg-emerald-950/60 border border-emerald-600/30 text-emerald-800 dark:text-emerald-200 rounded-full text-[11px] font-medium shadow-2xs">
      <div className="relative flex items-center justify-center">
        {isSaving ? (
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        )}
      </div>

      <span className="font-semibold flex items-center gap-1">
        {isSaving ? (
          <span className="text-amber-600 dark:text-amber-300 flex items-center gap-1">
            <Save className="w-3 h-3 animate-spin" /> Saving draft...
          </span>
        ) : (
          <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {label}
          </span>
        )}
      </span>

      {lastSavedTime && !isSaving && (
        <span className="text-[10px] text-slate-500 dark:text-emerald-400/80 border-l border-emerald-500/20 pl-2">
          Saved {lastSavedTime}
        </span>
      )}

      {hasDraft && onClear && (
        <button
          type="button"
          onClick={onClear}
          title="Clear saved draft"
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer pl-1"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/**
 * Dedicated Interactive Scratchpad & Auto-Saver Vault Component
 */
export function AutoSaveNotesVault({ userId }: { userId: string }) {
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("My Lecture Notes & Scratchpad");
  const [savedNotice, setSavedNotice] = useState(false);

  const key = `scratchpad_${userId || 'guest'}`;
  const { isSaving, lastSavedTime, clearDraft } = useAutoSave(
    key,
    { title: noteTitle, content: noteContent },
    { debounceMs: 500 }
  );

  // Restore draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`lms_autosave_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.data) {
          if (parsed.data.content) setNoteContent(parsed.data.content);
          if (parsed.data.title) setNoteTitle(parsed.data.title);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [key]);

  const handleManualBackup = () => {
    try {
      localStorage.setItem(
        `lms_autosave_${key}`,
        JSON.stringify({
          data: { title: noteTitle, content: noteContent },
          timestamp: new Date().toISOString()
        })
      );
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-emerald-100 dark:border-emerald-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 rounded-xl">
            <FileText className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-serif font-bold text-sm text-emerald-900 dark:text-emerald-100">
              Auto-Saver Personal Vault
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-emerald-300/80">
              Your notes auto-save in real-time. Never lose thoughts, translation drafts, or lecture summaries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AutoSaveBadge isSaving={isSaving} lastSavedTime={lastSavedTime} />
          <button
            type="button"
            onClick={handleManualBackup}
            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <HardDriveUpload className="w-3.5 h-3.5" />
            <span>Backup</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Notes vault backed up to local storage!</span>
        </div>
      )}

      <input
        type="text"
        value={noteTitle}
        onChange={(e) => setNoteTitle(e.target.value)}
        placeholder="Note Title..."
        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-950 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <textarea
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        rows={4}
        placeholder="Type lecture notes, translation drafts, or reminders here... (Auto-saves automatically)"
        className="w-full p-3 bg-slate-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed resize-y"
      />

      <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-emerald-400/70">
        <span>Words: {noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0} • Characters: {noteContent.length}</span>
        {noteContent && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to clear your scratchpad notes?")) {
                setNoteContent("");
                clearDraft();
              }
            }}
            className="text-red-500 hover:underline cursor-pointer"
          >
            Clear Notes
          </button>
        )}
      </div>
    </div>
  );
}
