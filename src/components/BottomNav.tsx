import React from 'react';
import { motion } from 'motion/react';
import { Piano, ListMusic } from 'lucide-react';
import { usePianoStore } from '../store/usePianoStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BottomNav: React.FC = () => {
  const activeView = usePianoStore(state => state.activeView);
  const setActiveView = usePianoStore(state => state.setActiveView);

  return (
    <nav className="h-16 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-center px-6 gap-8 z-50 shrink-0">
      <button
        onClick={() => setActiveView('piano')}
        className={cn(
          "flex flex-col items-center gap-1 transition-all relative group",
          activeView === 'piano' ? "text-indigo-400" : "text-white/40 hover:text-white/60"
        )}
      >
        <div className={cn(
          "p-2 rounded-xl transition-all",
          activeView === 'piano' ? "bg-indigo-500/10" : "group-hover:bg-white/5"
        )}>
          <Piano className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">Piano</span>
        {activeView === 'piano' && (
          <motion.div 
            layoutId="activeTab"
            className="absolute -bottom-2 left-0 right-0 h-0.5 bg-indigo-400 rounded-full"
          />
        )}
      </button>

      <button
        onClick={() => setActiveView('sequencer')}
        className={cn(
          "flex flex-col items-center gap-1 transition-all relative group",
          activeView === 'sequencer' ? "text-indigo-400" : "text-white/40 hover:text-white/60"
        )}
      >
        <div className={cn(
          "p-2 rounded-xl transition-all",
          activeView === 'sequencer' ? "bg-indigo-500/10" : "group-hover:bg-white/5"
        )}>
          <ListMusic className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">Sequencer</span>
        {activeView === 'sequencer' && (
          <motion.div 
            layoutId="activeTab"
            className="absolute -bottom-2 left-0 right-0 h-0.5 bg-indigo-400 rounded-full"
          />
        )}
      </button>
    </nav>
  );
};
