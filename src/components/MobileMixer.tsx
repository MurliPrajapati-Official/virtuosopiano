import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, X, Volume2, Zap } from 'lucide-react';
import { usePianoStore } from '../store/usePianoStore';

export const MobileMixer: React.FC = () => {
  const { volume, setVolume, bass, setBass } = usePianoStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-[60] lg:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Mixer</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/20 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Volume */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-white/60 uppercase">Volume</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">{Math.round(volume * 100)}%</span>
              </div>
              <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-emerald-500"
                  animate={{ width: `${volume * 100}%` }}
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

            {/* Bass */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-bold text-white/60 uppercase">Bass Boost</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">{Math.round(bass * 100)}%</span>
              </div>
              <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-indigo-500"
                  animate={{ width: `${bass * 100}%` }}
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
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-white text-black scale-90' : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
      >
        {isOpen ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
      </button>
    </div>
  );
};
