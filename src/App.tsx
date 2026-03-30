import React, { useEffect, useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { Keyboard } from './components/Keyboard';
import { PianoRoll } from './components/PianoRoll';
import { InstrumentSelector } from './components/InstrumentSelector';
import { SettingsPanel } from './components/SettingsPanel';
import { ProjectManager } from './components/ProjectManager';
import { SaveModal } from './components/SaveModal';
import { MobileMixer } from './components/MobileMixer';
import { BottomNav } from './components/BottomNav';
import { usePianoStore } from './store/usePianoStore';
import { engine } from './audio/AudioEngine';
import { useMidi } from './hooks/useMidi';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { 
    isPlaying, bpm, notes, 
    currentSound, isRecording, 
    addNote, totalBeats, volume, bass,
    pitch, timbre,
    currentProjectName, activeView
  } = usePianoStore();
  const [isAudioReady, setIsAudioReady] = useState(false);
  const lastBeatRef = useRef<number>(-1);
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const recordingStartTime = useRef<number | null>(null);

  useMidi();

  // Sync Audio Engine Settings
  useEffect(() => {
    if (isAudioReady) {
      engine.setMasterVolume(volume);
      engine.setBass(bass);
      engine.setPitch(pitch);
      engine.setTimbre(timbre);
    }
  }, [volume, bass, pitch, timbre, isAudioReady]);

  const handleStartAudio = async () => {
    await engine.resume();
    setIsAudioReady(true);
  };

  // Recording Logic
  useEffect(() => {
    if (isRecording && !recordingStartTime.current) {
      recordingStartTime.current = performance.now();
    } else if (!isRecording) {
      recordingStartTime.current = null;
    }
  }, [isRecording]);

  // Smooth Playhead and Playback Logic
  const lastPositionRef = useRef<number>(0);
  const playheadPosRef = useRef<number>(0);
  const sortedNotesRef = useRef<any[]>([]);
  const lastActiveIdsRef = useRef<string>('');
  const nextNoteIndexRef = useRef<number>(0);

  // Pre-sort notes whenever they change
  useEffect(() => {
    sortedNotesRef.current = [...notes].sort((a, b) => a.startTime - b.startTime);
    // Reset pointer when notes change
    nextNoteIndexRef.current = 0;
  }, [notes]);

  useEffect(() => {
    if (!isPlaying || !isAudioReady) {
      cancelAnimationFrame(requestRef.current);
      lastPositionRef.current = 0;
      playheadPosRef.current = 0;
      nextNoteIndexRef.current = 0;
      window.dispatchEvent(new CustomEvent('playhead-update', { detail: 0 }));
      window.dispatchEvent(new CustomEvent('active-notes-update', { detail: new Set() }));
      lastActiveIdsRef.current = '';
      return;
    }

    const secondsPerBeat = 60 / bpm;
    const totalDuration = totalBeats * secondsPerBeat;
    startTimeRef.current = performance.now() - (playheadPosRef.current * totalDuration * 1000);

    const animate = (time: number) => {
      const elapsed = (time - startTimeRef.current) / 1000;
      const progress = (elapsed % totalDuration) / totalDuration;
      const currentPos = progress * totalBeats;
      
      playheadPosRef.current = progress;
      window.dispatchEvent(new CustomEvent('playhead-update', { detail: progress }));

      const lastPos = lastPositionRef.current;
      
      // Efficiently find notes to trigger using the sorted array and a pointer
      const triggeredNotes = [];
      
      if (currentPos < lastPos) {
        // Wrap around - reset pointer
        nextNoteIndexRef.current = 0;
      }

      // Start from the last known index
      let idx = nextNoteIndexRef.current;
      while (idx < sortedNotesRef.current.length) {
        const note = sortedNotesRef.current[idx];
        if (note.startTime >= lastPos && note.startTime < currentPos) {
          triggeredNotes.push(note);
          idx++;
        } else if (note.startTime < lastPos && currentPos < lastPos) {
          // Handle wrap around case for notes at the beginning
          if (note.startTime < currentPos) {
            triggeredNotes.push(note);
            idx++;
          } else {
            break;
          }
        } else if (note.startTime >= currentPos) {
          // Since it's sorted, we can stop here
          break;
        } else {
          // Note is in the past, skip it
          idx++;
        }
      }
      nextNoteIndexRef.current = idx;

      triggeredNotes.forEach(note => {
        const durationInSeconds = note.duration * secondsPerBeat;
        engine.playNote(note.note, note.velocity, currentSound, durationInSeconds, note.id, note.hold);
      });

      // Update active note IDs for visual feedback
      const activeIds = new Set<string>();
      
      // Binary search for the first note that could possibly be active
      // Assuming max note duration is 32 beats for safety
      let low = 0;
      let high = sortedNotesRef.current.length - 1;
      let startIdx = 0;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (sortedNotesRef.current[mid].startTime >= currentPos - 32) {
          startIdx = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      for (let i = startIdx; i < sortedNotesRef.current.length; i++) {
        const note = sortedNotesRef.current[i];
        if (note.startTime > currentPos) break; 
        if (currentPos >= note.startTime && currentPos < note.startTime + note.duration) {
          activeIds.add(note.id);
        }
      }

      const activeIdsString = Array.from(activeIds).sort().join(',');
      if (activeIdsString !== lastActiveIdsRef.current) {
        window.dispatchEvent(new CustomEvent('active-notes-update', { detail: activeIds }));
        lastActiveIdsRef.current = activeIdsString;
      }

      lastPositionRef.current = currentPos;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, bpm, notes, isAudioReady, currentSound, totalBeats]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0a0a] font-sans selection:bg-indigo-500/30 overflow-hidden">
      <AnimatePresence>
        {!isAudioReady && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full text-center space-y-8">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/30 shadow-2xl shadow-indigo-500/20"
              >
                <span className="text-4xl">🎹</span>
              </motion.div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-white tracking-tight">Virtuoso</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">Experience a professional-grade piano workstation in your browser. Low latency, high fidelity.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleStartAudio}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] uppercase tracking-widest text-xs"
                >
                  Initialize Engine
                </button>
                <button
                  onClick={() => engine.playNote(60, 0.5, 'electric-piano')}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/40 text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest"
                >
                  Test Audio Output
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toolbar />
      <InstrumentSelector />
      <SettingsPanel />
      <ProjectManager />
      <SaveModal />
      <MobileMixer />
      
      <main className="flex-1 relative flex flex-col pt-32 min-h-0">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-indigo-600/10 blur-[120px] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {activeView === 'piano' ? (
            <motion.div 
              key="piano"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col justify-center pb-20"
            >
              <div className="h-[40vh] min-h-[250px] flex flex-col justify-end pb-4 shrink-0">
                <Keyboard />
              </div>
              <div className="text-center mt-8 space-y-2">
                <h2 className="text-xl font-black text-white/80 uppercase tracking-tighter">Performance Mode</h2>
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Low Latency Multi-Touch Active</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="sequencer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0 bg-black/40 overflow-hidden"
            >
              <div className="px-8 py-2 flex items-center justify-between border-y border-white/5 bg-black/20 shrink-0">
                <div className="flex items-center gap-4">
                  <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Sequencer Roll</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    <span className="text-[9px] font-bold text-white/40 uppercase">{totalBeats} Steps / {totalBeats/4} Bars</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   {currentProjectName && (
                     <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                       {currentProjectName}
                     </span>
                   )}
                   <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Auto-Quantize Active</span>
                </div>
              </div>
              <PianoRoll />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />

      {/* Minimal Status Bar */}
      <footer className="h-8 flex items-center justify-between px-8 bg-black/60 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-indigo-500" />
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">Engine: v2.1.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">Latency: 4ms</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-bold text-white/10 uppercase tracking-widest">
          <span>Workstation Mode</span>
          <div className="w-0.5 h-0.5 rounded-full bg-white/10" />
          <span>Multi-Touch v2</span>
        </div>
      </footer>
    </div>
  );
}
