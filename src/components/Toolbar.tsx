import React from 'react';
import { Play, Square, Piano, Settings, Save, FolderOpen, FilePlus, Download } from 'lucide-react';
import { usePianoStore } from '../store/usePianoStore';
import { motion } from 'motion/react';

export const Toolbar: React.FC = () => {
  const { 
    isPlaying, togglePlay, 
    currentSound, setShowInstrumentSelector,
    clearNotes, setShowSettings,
    volume, setVolume,
    bass, setBass,
    saveProject, setShowProjectManager,
    createNewProject, currentProjectName,
    setShowSaveModal, exportProject
  } = usePianoStore();

  const handleSaveClick = () => {
    if (!currentProjectName) {
      setShowSaveModal(true);
    } else {
      saveProject();
      const btn = document.activeElement as HTMLElement;
      if (btn) {
        const originalText = btn.innerText;
        btn.innerText = 'SAVED!';
        setTimeout(() => {
          btn.innerText = originalText;
        }, 2000);
      }
    }
  };

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass-panel rounded-full w-auto max-w-[98vw] shadow-2xl border border-white/10">
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Instrument Selector Trigger */}
        <button
          onClick={() => setShowInstrumentSelector(true)}
          className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white group shrink-0"
        >
          <Piano className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] sm:text-xs font-bold capitalize hidden sm:inline">{currentSound.replace('-', ' ')}</span>
        </button>
      </div>

      <div className="w-px h-5 bg-white/10 mx-0.5 hidden lg:block" />

      {/* Sound Shaping - Bass Bar */}
      <div className="hidden lg:flex items-center gap-4 px-2">
        <div className="flex flex-col gap-1 w-24">
          <div className="flex justify-between text-[8px] font-black text-white/50 uppercase tracking-widest">
            <span className="text-indigo-400">Bass</span>
            <span className="text-white">{Math.round(bass * 100)}%</span>
          </div>
          <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
            <div 
              className="absolute inset-y-0 left-0 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
              style={{ width: `${bass * 100}%` }}
            />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={bass}
              onChange={(e) => setBass(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 w-24">
          <div className="flex justify-between text-[8px] font-black text-white/50 uppercase tracking-widest">
            <span className="text-emerald-400">Vol</span>
            <span className="text-white">{Math.round(volume * 100)}%</span>
          </div>
          <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
            <div 
              className="absolute inset-y-0 left-0 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
              style={{ width: `${volume * 100}%` }}
            />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
        </div>
      </div>

      <div className="w-px h-5 bg-white/10 mx-0.5 hidden sm:block" />

      {/* Storage Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={createNewProject}
          title="New Note"
          className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all group"
        >
          <FilePlus className="w-3 h-3 sm:w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="text-[8px] font-black uppercase tracking-tighter hidden lg:inline">New</span>
        </button>

        <button
          onClick={handleSaveClick}
          title="Save Project"
          className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all group"
        >
          <Save className="w-3 h-3 sm:w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="text-[8px] font-black uppercase tracking-tighter hidden lg:inline">Save</span>
        </button>

        <button
          onClick={exportProject}
          title="Export as File"
          className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all group"
        >
          <Download className="w-3 h-3 sm:w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="text-[8px] font-black uppercase tracking-tighter hidden lg:inline">Export</span>
        </button>
        
        <button
          onClick={() => setShowProjectManager(true)}
          title="Saved Play Notes"
          className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-full text-indigo-300 hover:text-indigo-200 transition-all group"
        >
          <FolderOpen className="w-3 h-3 sm:w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="text-[8px] font-black uppercase tracking-tighter hidden lg:inline">Saved</span>
        </button>
      </div>

      <div className="w-px h-5 bg-white/10 mx-0.5 hidden sm:block" />

      {/* Playback Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={togglePlay}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
            isPlaying ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          {isPlaying ? <Square className="w-3 h-3 sm:w-3.5 h-3.5 fill-current" /> : <Play className="w-3 h-3 sm:w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>

        <button
          onClick={clearNotes}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all text-[8px] font-black"
        >
          CLR
        </button>
      </div>

      <div className="w-px h-5 bg-white/10 mx-0.5" />

      {/* Settings Trigger */}
      <button 
        onClick={() => setShowSettings(true)}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
      >
        <Settings className="w-3 h-3 sm:w-3.5 h-3.5" />
      </button>
    </div>
  );
};
