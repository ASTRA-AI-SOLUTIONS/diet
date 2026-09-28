import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDiet } from '../context/DietContext';
import { useAuth } from '../context/AuthContext';
import { X, Download, Upload, Check, Copy, AlertTriangle } from 'lucide-react';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({ isOpen, onClose }) => {
  const { exportAllData, importAllData } = useDiet();
  const { users } = useAuth();

  const [importJson, setImportJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleExportDownload = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      users,
      dietLogs: JSON.parse(exportAllData()),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astradiet_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatusMessage({ text: 'Backup file exported successfully!' });
  };

  const handleCopyJson = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      users,
      dietLogs: JSON.parse(exportAllData()),
    };

    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!importJson.trim()) return;

    try {
      const parsed = JSON.parse(importJson.trim());
      if (parsed.dietLogs) {
        importAllData(JSON.stringify(parsed.dietLogs));
      } else {
        importAllData(importJson.trim());
      }
      setStatusMessage({ text: 'Data restored and synced successfully!' });
      setImportJson('');
    } catch {
      setStatusMessage({ text: 'Invalid JSON format. Please verify your backup file.', error: true });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] text-zinc-100 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Cross-Device Sync & Data Backup
              </h3>
              <p className="text-xs text-zinc-400">
                Transfer your diet logs seamlessly between mobile, tablet, and desktop
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMessage.error
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                }`}
              >
                {statusMessage.error ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 shrink-0" />
                )}
                {statusMessage.text}
              </div>
            )}

            {/* Export Section */}
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                Export Current State
              </span>
              <p className="text-xs text-zinc-400">
                Download a clean JSON archive containing your logged meals, water balance, and user profiles.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleExportDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-white transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup File
                </button>
                <button
                  onClick={handleCopyJson}
                  className="px-3.5 py-2 rounded-xl border border-white/[0.08] bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Import Section */}
            <form onSubmit={handleImportSubmit} className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                Restore / Import Backup
              </span>
              <p className="text-xs text-zinc-400">
                Paste JSON data from another device to sync your nutrition logs instantly.
              </p>
              <textarea
                rows={3}
                placeholder="Paste exported JSON here..."
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 p-2.5 text-xs text-zinc-200 font-mono focus:border-zinc-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!importJson.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-800 border border-white/[0.08] text-zinc-200 text-xs font-semibold hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload className="w-3.5 h-3.5" />
                Import & Sync Data
              </button>
            </form>

            <div className="text-[11px] text-zinc-500 text-center">
              ✓ Fully compatible with Vercel and zero server lock-in. Works 100% offline via local device caching.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
