import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Download, Music } from 'lucide-react';
import { usePianoStore } from '../store/usePianoStore';

export const SaveModal: React.FC = () => {
  const { 
    showSaveModal, 
    setShowSaveModal, 
    saveProject, 
    currentProjectName,
    exportProject
  } = usePianoStore();
  
  const [name, setName] = useState('');

  useEffect(() => {
    if (showSaveModal) {
      setName(currentProjectName || '');
    }
  }, [showSaveModal, currentProjectName]);

  if (!showSaveModal) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      saveProject(name.trim());
      setShowSaveModal(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSaveModal(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Save className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Save Project</h2>
                <p className="text-sm text-white/40">Give your masterpiece a name</p>
              </div>
            </div>
            <button
              onClick={() => setShowSaveModal(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">
                Project Name
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Midnight Sonata"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                <Save className="w-4 h-4" />
                Save Internal
              </button>
              <button
                type="button"
                onClick={() => {
                  exportProject();
                  setShowSaveModal(false);
                }}
                className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/5"
              >
                <Download className="w-4 h-4" />
                Export File
              </button>
            </div>
          </form>

          <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-3 h-3 text-white/20" />
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                Saves to Local Storage
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
