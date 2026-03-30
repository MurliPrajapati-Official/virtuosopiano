import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { engine } from '../audio/AudioEngine';
import { usePianoStore } from '../store/usePianoStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface KeyProps {
  midi: number;
  isActive: boolean;
  isBlack: boolean;
  noteName: string;
  showKeyLabels: boolean;
  animationIntensity: number;
  onPlay: (midi: number) => void;
  onStop: (midi: number) => void;
}

const Key = React.memo<KeyProps>(({ 
  midi, isActive, isBlack, noteName, showKeyLabels, animationIntensity, onPlay, onStop 
}) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const whiteKeyWidth = isMobile ? 'w-10' : 'w-16';
  const blackKeyWidth = isMobile ? 'w-6' : 'w-10';
  const blackKeyMargin = isMobile ? '-mx-3' : '-mx-5';

  return (
    <div
      data-midi={midi}
      onMouseDown={() => onPlay(midi)}
      onMouseUp={() => onStop(midi)}
      onMouseEnter={(e) => e.buttons === 1 && onPlay(midi)}
      onMouseLeave={() => onStop(midi)}
      className={cn(
        "relative flex-shrink-0 transition-all select-none cursor-pointer",
        isBlack 
          ? `z-10 ${blackKeyWidth} h-[60%] ${blackKeyMargin} rounded-b-lg key-black` 
          : `z-0 ${whiteKeyWidth} h-full rounded-b-2xl key-white border-x border-black/5`,
        isActive && (isBlack ? "key-black-active" : "key-white-active")
      )}
      style={{ transitionDuration: `${75 / animationIntensity}ms` }}
    >
      {!isBlack && showKeyLabels && (
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-black/20 font-bold uppercase pointer-events-none">
          {noteName}{Math.floor(midi / 12) - 1}
        </span>
      )}
      
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 / animationIntensity }}
            className={cn(
              "absolute bottom-0 left-0 right-0 h-1 rounded-full blur-md",
              isBlack ? "bg-indigo-400/60" : "bg-indigo-500/40"
            )}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export const Keyboard: React.FC = () => {
  const currentSound = usePianoStore(state => state.currentSound);
  const octaveOffset = usePianoStore(state => state.octaveOffset);
  const showKeyLabels = usePianoStore(state => state.showKeyLabels);
  const animationIntensity = usePianoStore(state => state.animationIntensity);

  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const [, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const touchMap = useRef<Map<number, number>>(new Map());

  const playNote = (midi: number) => {
    if (!activeKeys.has(midi)) {
      engine.playNote(midi, 0.8, currentSound);
      setActiveKeys(prev => new Set(prev).add(midi));
    }
  };

  const stopNote = (midi: number) => {
    engine.stopNote(midi);
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  };

  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches = Array.from(e.touches);
    const newActiveMidis = new Set<number>();

    touches.forEach((touch: React.Touch) => {
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const midiStr = element?.getAttribute('data-midi');
      if (midiStr) {
        const midi = parseInt(midiStr);
        newActiveMidis.add(midi);
        if (!activeKeys.has(midi)) {
          playNote(midi);
        }
      }
    });

    // Stop notes that are no longer being touched
    activeKeys.forEach(midi => {
      if (!newActiveMidis.has(midi)) {
        stopNote(midi);
      }
    });
  };

  const renderKeys = React.useMemo(() => {
    const keys = [];
    const startNote = 21; 
    const endNote = 108; 

    for (let midi = startNote; midi <= endNote; midi++) {
      const noteName = NOTES[midi % 12];
      const isBlack = noteName.includes('#');
      const isActive = activeKeys.has(midi);

      keys.push(
        <Key
          key={midi}
          midi={midi}
          isActive={isActive}
          isBlack={isBlack}
          noteName={noteName}
          showKeyLabels={showKeyLabels}
          animationIntensity={animationIntensity}
          onPlay={playNote}
          onStop={stopNote}
        />
      );
    }
    return keys;
  }, [activeKeys, showKeyLabels, animationIntensity]);

  // Initial scroll to middle C
  useEffect(() => {
    if (containerRef.current) {
      const middleCKey = containerRef.current.querySelector('[data-midi="60"]');
      if (middleCKey) {
        const containerWidth = containerRef.current.clientWidth;
        const keyOffset = (middleCKey as HTMLElement).offsetLeft;
        containerRef.current.scrollLeft = keyOffset - containerWidth / 2;
      }
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouch}
      className="w-full h-full overflow-x-auto overflow-y-hidden bg-black/20 custom-scrollbar"
    >
      <div className="flex h-full px-4 pt-2 min-w-max">
        {renderKeys}
      </div>
    </div>
  );
};
