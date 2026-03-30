import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePianoStore, SoundProfile } from '../store/usePianoStore';
import { Music, Piano, Zap, Wind } from 'lucide-react';

const INSTRUMENTS: { id: SoundProfile; name: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'grand-piano', name: 'Grand Piano', icon: <Piano className="w-6 h-6" />, desc: 'Classic acoustic resonance' },
  { id: 'electric-piano', name: 'Electric Piano', icon: <Zap className="w-6 h-6" />, desc: 'Smooth vintage tines' },
  { id: 'synth-lead', name: 'Synth Lead', icon: <Music className="w-6 h-6" />, desc: 'Bright electronic punch' },
  { id: 'pad', name: 'Atmospheric Pad', icon: <Wind className="w-6 h-6" />, desc: 'Lush ambient textures' },
];

export const InstrumentSelector: React.FC = () => {
  const { currentSound, setSound, showInstrumentSelector, setShowInstrumentSelector } = usePianoStore();

  return (
    <AnimatePresence>
      {showInstrumentSelector && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInstrumentSelector(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 glass-panel rounded-t-[32px] z-[70] p-8 pb-12"
          >
            <div className="max-w-md mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Select Instrument</h2>
                <button 
                  onClick={() => setShowInstrumentSelector(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {INSTRUMENTS.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setSound(inst.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      currentSound === inst.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      currentSound === inst.id ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      {inst.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{inst.name}</div>
                      <div className="text-xs opacity-60">{inst.desc}</div>
                    </div>
                    {currentSound === inst.id && (
                      <motion.div layoutId="active-inst" className="ml-auto w-2 h-2 rounded-full bg-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
