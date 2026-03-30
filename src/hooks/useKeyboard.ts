import { useEffect, useState, useRef } from 'react';
import { engine } from '../audio/AudioEngine';
import { usePianoStore } from '../store/usePianoStore';

const KEY_MAP: Record<string, number> = {
  'a': 60, // C4
  'w': 61, // C#4
  's': 62, // D4
  'e': 63, // D#4
  'd': 64, // E4
  'f': 65, // F4
  't': 66, // F#4
  'g': 67, // G4
  'y': 68, // G#4
  'h': 69, // A4
  'u': 70, // A#4
  'j': 71, // B4
  'k': 72, // C5
};

export function useKeyboard() {
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const { currentSound, isRecording, bpm, addNote } = usePianoStore();
  const recordingStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording && !recordingStartTime.current) {
      recordingStartTime.current = Date.now();
    } else if (!isRecording) {
      recordingStartTime.current = null;
    }
  }, [isRecording]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const midi = KEY_MAP[e.key.toLowerCase()];
      if (midi) {
        engine.playNote(midi, 0.8, currentSound);
        setActiveKeys((prev) => new Set(prev).add(midi));

        if (isRecording && recordingStartTime.current) {
          const elapsedMs = Date.now() - recordingStartTime.current;
          const beat = (elapsedMs / 1000) * (bpm / 60);
          addNote({
            id: Math.random().toString(36).substr(2, 9),
            note: midi,
            startTime: Math.round(beat), // Quantize to nearest beat for simplicity
            duration: 1,
            velocity: 0.8
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const midi = KEY_MAP[e.key.toLowerCase()];
      if (midi) {
        engine.stopNote(midi);
        setActiveKeys((prev) => {
          const next = new Set(prev);
          next.delete(midi);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentSound]);

  return activeKeys;
}
