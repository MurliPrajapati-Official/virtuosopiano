import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePianoStore } from '../store/usePianoStore';
import { Volume2, Sparkles, Type, Activity, Sliders, Database, X } from 'lucide-react';
import { engine } from '../audio/AudioEngine';

export const SettingsPanel: React.FC = () => {
  const { 
    showSettings, setShowSettings,
    volume, setVolume,
    reverb, setReverb,
    pitch, setPitch,
    timbre, setTimbre,
    showKeyLabels, setShowKeyLabels,
    animationIntensity, setAnimationIntensity
  } = usePianoStore();

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    engine.setMasterVolume(val);
  };

  const handlePitchChange = (val: number) => {
    setPitch(val);
    engine.setPitch(val);
  };

  const handleTimbreChange = (val: number) => {
    setTimbre(val);
    engine.setTimbre(val);
  };

  return (
    <AnimatePresence>
      {showSettings && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md glass-panel z-[90] flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Settings</h2>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Audio Settings */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Volume2 className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Audio Engine</h3>
                </div>
                <div className="space-y-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-white/60">
                      <span>Master Volume</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-white/60">
                      <span>Reverb Amount</span>
                      <span>{Math.round(reverb * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={reverb}
                      onChange={(e) => setReverb(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-white/60">
                      <span>Pitch Shift</span>
                      <span>{Math.round((pitch - 0.5) * 24)} semitones</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={pitch}
                      onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-white/60">
                      <span>Timbre / Color</span>
                      <span>{Math.round(timbre * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={timbre}
                      onChange={(e) => handleTimbreChange(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </section>

              {/* Display Settings */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Type className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Visuals</h3>
                </div>
                <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setShowKeyLabels(!showKeyLabels)}
                    className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-all"
                  >
                    <span className="text-sm font-bold text-white/80">Show Key Labels</span>
                    <div className={`w-10 h-6 rounded-full transition-all relative ${showKeyLabels ? 'bg-indigo-600' : 'bg-white/10'}`}>
                      <motion.div 
                        animate={{ x: showKeyLabels ? 18 : 2 }}
                        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </button>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-xs font-bold text-white/60">
                      <span>Animation Intensity</span>
                      <span>{Math.round(animationIntensity * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="2" step="0.1" value={animationIntensity}
                      onChange={(e) => setAnimationIntensity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </section>

              {/* Interaction Settings */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Activity className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Interaction</h3>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm font-bold text-white/80">Latency Mode</span>
                    <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">LOW</span>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm font-bold text-white/80">Glissando Sensitivity</span>
                    <span className="text-[10px] font-black bg-white/10 text-white/40 px-2 py-1 rounded">HIGH</span>
                  </div>
                </div>
              </section>

              {/* Data Settings */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Database className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Data & Export</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-center transition-all">
                    <div className="text-xs font-black text-white/80 uppercase">Export MIDI</div>
                  </button>
                  <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-center transition-all">
                    <div className="text-xs font-black text-white/80 uppercase">Save Project</div>
                  </button>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20">
              <button className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-red-500/20">
                Reset All Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
