import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Music, Trash2, Clock, Play, Timer, Gauge, Activity } from 'lucide-react';
import { usePianoStore } from '../store/usePianoStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NOTES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [8, 7, 6, 5, 4, 3, 2, 1, 0]; // Full piano range

const getResponsiveConfig = (zoom: number = 1) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return {
    ROW_HEIGHT: (isMobile ? 28 : 36) * zoom,
    BEAT_WIDTH: (isMobile ? 48 : 64) * zoom
  };
};

const Playhead: React.FC<{ scrollContainerRef: React.RefObject<HTMLDivElement>, totalBeats: number, BEAT_WIDTH: number }> = ({ scrollContainerRef, totalBeats, BEAT_WIDTH }) => {
  const isPlaying = usePianoStore(state => state.isPlaying);
  const playheadRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleUpdate = (e: any) => {
      const progress = e.detail;
      if (playheadRef.current) {
        const x = progress * totalBeats * BEAT_WIDTH;
        playheadRef.current.style.transform = `translateX(${x}px)`;
        
        // Auto-scroll logic
        if (isPlaying && scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const clientWidth = container.clientWidth;
          const scrollLeft = container.scrollLeft;
          const padding = clientWidth * 0.2;

          if (x > scrollLeft + clientWidth - padding) {
            container.scrollLeft = x - clientWidth + padding;
          } else if (x < scrollLeft + padding) {
            container.scrollLeft = Math.max(0, x - padding);
          }
        }
      }
    };

    window.addEventListener('playhead-update', handleUpdate);
    return () => window.removeEventListener('playhead-update', handleUpdate);
  }, [isPlaying, totalBeats, scrollContainerRef, BEAT_WIDTH]);

  return (
    <div 
      ref={playheadRef}
      className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 z-30 shadow-[0_0_10px_rgba(129,140,248,0.8)] pointer-events-none will-change-transform"
      style={{ left: 0 }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(129,140,248,1)]" />
    </div>
  );
};

const HoverHighlight: React.FC<{ allNotes: any[], ROW_HEIGHT: number, BEAT_WIDTH: number }> = ({ allNotes, ROW_HEIGHT, BEAT_WIDTH }) => {
  const highlightRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleUpdate = (e: any) => {
      const data = e.detail;
      if (highlightRef.current) {
        if (data) {
          const { midi, beat } = data;
          const noteIndex = allNotes.findIndex(n => n.midi === midi);
          if (noteIndex !== -1) {
            highlightRef.current.style.display = 'block';
            highlightRef.current.style.transform = `translate(${beat * BEAT_WIDTH}px, ${noteIndex * ROW_HEIGHT}px)`;
          } else {
            highlightRef.current.style.display = 'none';
          }
        } else {
          highlightRef.current.style.display = 'none';
        }
      }
    };

    window.addEventListener('grid-hover-update', handleUpdate);
    return () => window.removeEventListener('grid-hover-update', handleUpdate);
  }, [allNotes, ROW_HEIGHT, BEAT_WIDTH]);

  return (
    <div 
      ref={highlightRef}
      className="absolute bg-indigo-500/20 pointer-events-none z-0 will-change-transform hidden"
      style={{
        width: BEAT_WIDTH / 4,
        height: ROW_HEIGHT,
        left: 0,
        top: 0
      }}
    />
  );
};

const Note = React.memo<{ 
  note: any, 
  noteIndex: number, 
  isActive: boolean,
  removeNote: (id: string) => void, 
  isResizingRef: React.RefObject<boolean>,
  handleResize: any,
  onContextMenu: (e: React.MouseEvent, id: string) => void,
  ROW_HEIGHT: number,
  BEAT_WIDTH: number
}>(({ note, noteIndex, isActive, removeNote, isResizingRef, handleResize, onContextMenu, ROW_HEIGHT, BEAT_WIDTH }) => {
  return (
    <div
      className={cn(
        "absolute rounded-md border cursor-pointer hover:brightness-110 transition-all z-20 group will-change-transform",
        isActive ? "bg-white border-white scale-[1.02] shadow-[0_0_25px_rgba(255,255,255,0.8)]" : 
        note.hold ? "bg-amber-400 border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.4)]" : 
        "bg-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
      )}
      style={{
        left: note.startTime * BEAT_WIDTH + 1,
        top: noteIndex * ROW_HEIGHT + 1,
        width: Math.max(4, note.duration * BEAT_WIDTH - 2),
        height: Math.max(4, ROW_HEIGHT - 2),
      }}
      onContextMenu={(e) => onContextMenu(e, note.id)}
      onClick={(e) => {
        e.stopPropagation();
        if (!isResizingRef.current) {
          removeNote(note.id);
        }
      }}
    >
      {note.hold && (
        <div className="absolute top-0 right-1 p-0.5">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        </div>
      )}
      
      {/* Left Resize Handle */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 rounded-l-md flex items-center justify-center z-30"
        onMouseDown={(e) => handleResize(note.id, e, 'left', e.clientX, note.startTime, note.duration)}
        onTouchStart={(e) => handleResize(note.id, e, 'left', e.touches[0].clientX, note.startTime, note.duration)}
      >
        <div className="w-0.5 h-4 bg-white/20 rounded-full" />
      </div>

      {/* Right Resize Handle */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 rounded-r-md flex items-center justify-center z-30"
        onMouseDown={(e) => handleResize(note.id, e, 'right', e.clientX, note.startTime, note.duration)}
        onTouchStart={(e) => handleResize(note.id, e, 'right', e.touches[0].clientX, note.startTime, note.duration)}
      >
        <div className="w-0.5 h-4 bg-white/20 rounded-full" />
      </div>
    </div>
  );
});

export const PianoRoll: React.FC = () => {
  const notes = usePianoStore(state => state.notes);
  const addNote = usePianoStore(state => state.addNote);
  const removeNote = usePianoStore(state => state.removeNote);
  const toggleHold = usePianoStore(state => state.toggleHold);
  const totalBeats = usePianoStore(state => state.totalBeats);
  const totalDuration = usePianoStore(state => state.totalDuration);
  const setTotalDuration = usePianoStore(state => state.setTotalDuration);
  const bpm = usePianoStore(state => state.bpm);
  const setBpm = usePianoStore(state => state.setBpm);
  const zoom = usePianoStore(state => state.zoom);
  const setZoom = usePianoStore(state => state.setZoom);

  const sortedNotes = React.useMemo(() => {
    return [...notes].sort((a, b) => a.startTime - b.startTime);
  }, [notes]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [activeNoteIds, setActiveNoteIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, noteId: string } | null>(null);

  const scrollRequestRef = useRef<number>(0);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (scrollRequestRef.current) return;
    
    scrollRequestRef.current = requestAnimationFrame(() => {
      setScrollLeft(target.scrollLeft);
      setScrollTop(target.scrollTop);
      scrollRequestRef.current = 0;
    });
  };

  // Handle active notes update centrally
  React.useEffect(() => {
    const handleActiveUpdate = (e: any) => {
      setActiveNoteIds(e.detail);
    };
    window.addEventListener('active-notes-update', handleActiveUpdate);
    return () => window.removeEventListener('active-notes-update', handleActiveUpdate);
  }, []);

  // Resize observer for container size
  React.useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const allNotes = React.useMemo(() => 
    OCTAVES.flatMap(octave => NOTES.map(note => ({ 
      note, 
      octave, 
      midi: (octave + 1) * 12 + (11 - NOTES.indexOf(note)) 
    }))).filter(n => n.midi >= 0 && n.midi <= 127)
  , []);

  const midiToIndexMap = React.useMemo(() => {
    const map: Record<number, number> = {};
    allNotes.forEach((n, i) => {
      map[n.midi] = i;
    });
    return map;
  }, [allNotes]);

  const { ROW_HEIGHT, BEAT_WIDTH } = getResponsiveConfig(zoom);

  const visibleNotes = React.useMemo(() => {
    if (containerSize.width === 0 || sortedNotes.length === 0) return [];
    
    const buffer = 4; // Extra beats/rows to render
    const startBeat = Math.max(0, (scrollLeft / BEAT_WIDTH) - buffer);
    const endBeat = (scrollLeft + containerSize.width) / BEAT_WIDTH + buffer;
    const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - buffer);
    const endRow = Math.ceil((scrollTop + containerSize.height) / ROW_HEIGHT) + buffer;

    // Binary search for the first note that could be visible on X axis
    let low = 0;
    let high = sortedNotes.length - 1;
    let firstIdx = 0;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      // Assuming max duration is 128 beats for safety
      if (sortedNotes[mid].startTime >= startBeat - 128) {
        firstIdx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    const result = [];
    for (let i = firstIdx; i < sortedNotes.length; i++) {
      const note = sortedNotes[i];
      if (note.startTime > endBeat) break; 

      const noteIndex = midiToIndexMap[note.note];
      if (noteIndex === undefined) continue;
      
      const isVisibleX = note.startTime + note.duration >= startBeat;
      const isVisibleY = noteIndex >= startRow && noteIndex <= endRow;
      
      if (isVisibleX && isVisibleY) {
        result.push({
          ...note,
          noteIndex
        });
      }
    }
    return result;
  }, [sortedNotes, scrollLeft, scrollTop, containerSize, BEAT_WIDTH, ROW_HEIGHT, midiToIndexMap]);

  // Initial scroll to middle C (C4)
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const middleCIndex = allNotes.findIndex(n => n.midi === 60);
      if (middleCIndex !== -1) {
        scrollContainerRef.current.scrollTop = middleCIndex * ROW_HEIGHT - scrollContainerRef.current.clientHeight / 2;
      }
    }
  }, []);

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
      if (scrollRequestRef.current) cancelAnimationFrame(scrollRequestRef.current);
    };
  }, []);

  const isResizingRef = React.useRef(false);
  const [, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGridClick = (e: React.MouseEvent) => {
    if (isResizingRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const beat = Math.floor(x / (BEAT_WIDTH / 4)) / 4;
    const noteIndex = Math.floor(y / ROW_HEIGHT);
    const midi = allNotes[noteIndex]?.midi;
    
    if (midi === undefined) return;

    const existing = notes.find(n => n.note === midi && n.startTime === beat);
    if (existing) {
      removeNote(existing.id);
    } else {
      addNote({
        id: Math.random().toString(36).substr(2, 9),
        note: midi,
        startTime: beat,
        duration: 1,
        velocity: 0.8,
        hold: false
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const beat = Math.floor(x / (BEAT_WIDTH / 4)) / 4;
    const noteIndex = Math.floor(y / ROW_HEIGHT);
    const midi = allNotes[noteIndex]?.midi;
    
    window.dispatchEvent(new CustomEvent('grid-hover-update', { 
      detail: midi !== undefined ? { midi, beat } : null 
    }));
  };

  const handleNoteContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, noteId: id });
  };

  const handleResize = (id: string, e: React.MouseEvent | React.TouchEvent, direction: 'left' | 'right', startX: number, startStartTime: number, startDuration: number) => {
    e.stopPropagation();
    isResizingRef.current = true;
    
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaX = currentX - startX;
      const deltaBeats = Math.round(deltaX / BEAT_WIDTH * 4) / 4; // Quantize to 1/4 beat
      
      if (direction === 'right') {
        const newDuration = Math.max(0.25, startDuration + deltaBeats);
        usePianoStore.getState().updateNote(id, { duration: newDuration });
      } else {
        // Resizing from left
        const newStartTime = Math.max(0, startStartTime + deltaBeats);
        const actualDelta = newStartTime - startStartTime;
        const newDuration = Math.max(0.25, startDuration - actualDelta);
        
        // If we hit the minimum duration, don't move the start time further
        if (newDuration > 0.25 || actualDelta < 0) {
          usePianoStore.getState().updateNote(id, { 
            startTime: newStartTime,
            duration: newDuration 
          });
        }
      }
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      
      setTimeout(() => {
        isResizingRef.current = false;
      }, 50);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  return (
    <div className="flex-1 min-h-0 bg-black/40 border-y border-white/5 relative flex flex-col overflow-hidden">
      {/* Sequencer Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/50 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Timer className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center w-32">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">Duration</span>
                <span className="text-[10px] font-black text-indigo-400">{Math.round(totalDuration)}s</span>
              </div>
              <input 
                type="range" min="4" max="120" step="1" value={totalDuration}
                onChange={(e) => setTotalDuration(parseInt(e.target.value))}
                className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-violet-400" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center w-32">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">Zoom</span>
                <span className="text-[10px] font-black text-violet-400">{Math.round(zoom * 100)}%</span>
              </div>
              <input 
                type="range" min="0.5" max="2" step="0.1" value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center w-32">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">Speed (BPM)</span>
                <span className="text-[10px] font-black text-emerald-400">{bpm}</span>
              </div>
              <input 
                type="range" min="40" max="240" step="1" value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              {Math.ceil(totalBeats / 4)} Bars / {Math.round(totalBeats)} Beats
            </span>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[100] bg-zinc-900 border border-white/10 rounded-lg shadow-2xl py-1 min-w-[120px] overflow-hidden"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                toggleHold(contextMenu.noteId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between gap-4 transition-colors"
            >
              <span className="text-white/80">Hold Note</span>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${notes.find(n => n.id === contextMenu.noteId)?.hold ? 'bg-indigo-500' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${notes.find(n => n.id === contextMenu.noteId)?.hold ? 'left-4.5' : 'left-0.5'}`} />
              </div>
            </button>
            <button
              onClick={() => {
                removeNote(contextMenu.noteId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/20 text-red-400 transition-colors"
            >
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Scroll Container for both Labels and Grid */}
      <div 
        className="relative flex-1 overflow-x-auto overflow-y-auto custom-scrollbar select-none flex" 
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {/* Note Labels - Sticky Left, scrolls vertically with grid */}
        <div 
          className="sticky left-0 z-30 w-20 bg-black/90 border-r border-white/10 flex flex-col shadow-2xl shrink-0"
          style={{ height: allNotes.length * ROW_HEIGHT }}
        >
          {allNotes.map(({ note, octave, midi }) => (
            <div
              key={midi}
              className={`flex items-center justify-center text-[10px] font-black border-b border-white/5 shrink-0 ${
                note.includes('#') ? 'bg-white/5 text-white/30' : 'bg-transparent text-white/60'
              }`}
              style={{ height: ROW_HEIGHT }}
            >
              {note.includes('#') ? (
                <span className="flex items-baseline gap-0.5">
                  {note.replace('#', '')}<span className="text-[8px] opacity-60">(#)</span>
                  <span className="text-[7px] opacity-40 ml-0.5">{octave}</span>
                </span>
              ) : (
                <span>{note}{octave}</span>
              )}
            </div>
          ))}
        </div>

        {/* Grid Area */}
        <div 
          className="relative shrink-0 cursor-crosshair" 
          style={{ 
            width: totalBeats * BEAT_WIDTH,
            height: allNotes.length * ROW_HEIGHT,
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: `
              ${BEAT_WIDTH}px 100%,
              ${BEAT_WIDTH / 4}px 100%,
              100% ${ROW_HEIGHT}px
            `,
            backgroundPosition: '0 0'
          }}
          onClick={handleGridClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => window.dispatchEvent(new CustomEvent('grid-hover-update', { detail: null }))}
        >
          {/* Hover Highlight */}
          <HoverHighlight allNotes={allNotes} ROW_HEIGHT={ROW_HEIGHT} BEAT_WIDTH={BEAT_WIDTH} />

          {/* Render Notes */}
          <div className="relative z-10 pointer-events-none h-full">
            {visibleNotes.map((note) => (
              <div key={note.id} className="pointer-events-auto">
                <Note 
                  note={note}
                  noteIndex={note.noteIndex}
                  isActive={activeNoteIds.has(note.id)}
                  removeNote={removeNote}
                  isResizingRef={isResizingRef}
                  handleResize={handleResize}
                  onContextMenu={handleNoteContextMenu}
                  ROW_HEIGHT={ROW_HEIGHT}
                  BEAT_WIDTH={BEAT_WIDTH}
                />
              </div>
            ))}

            {/* Smooth Playhead */}
            <Playhead scrollContainerRef={scrollContainerRef} totalBeats={totalBeats} BEAT_WIDTH={BEAT_WIDTH} />
          </div>
        </div>
      </div>

      {/* Time Labels Footer */}
      <div className="h-8 bg-zinc-900/80 border-t border-white/5 flex items-center overflow-hidden relative">
        <div className="w-20 shrink-0 border-r border-white/10 h-full flex items-center justify-center bg-black/20">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter">Timeline</span>
        </div>
        <div 
          className="flex-1 h-full relative overflow-hidden"
          style={{ width: totalBeats * BEAT_WIDTH }}
        >
          {/* We use a separate div that matches the grid's scroll position */}
          <div 
            className="absolute inset-0 flex"
            style={{ 
              transform: `translateX(-${scrollLeft}px)`,
              width: totalBeats * BEAT_WIDTH 
            }}
          >
            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => {
              const beatPos = (i * bpm / 60);
              if (beatPos > totalBeats) return null;
              return (
                <div 
                  key={i}
                  className="absolute top-0 bottom-0 flex flex-col justify-center"
                  style={{ left: beatPos * BEAT_WIDTH }}
                >
                  <div className="h-2 w-px bg-white/20 mb-1" />
                  <span className="text-[9px] font-black text-white/40 ml-1">{i}s</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
