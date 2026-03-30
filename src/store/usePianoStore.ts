import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SoundProfile = 'grand-piano' | 'electric-piano' | 'synth-lead' | 'pad';

export interface NoteEvent {
  id: string;
  note: number; // MIDI note number
  startTime: number; // in beats
  duration: number; // in beats
  velocity: number; // 0-1
  hold?: boolean;
}

export interface Project {
  id: string;
  name: string;
  notes: NoteEvent[];
  bpm: number;
  currentSound: SoundProfile;
  totalBeats: number;
  volume: number;
  bass: number;
  updatedAt: number;
}

interface PianoState {
  bpm: number;
  isPlaying: boolean;
  isRecording: boolean;
  currentSound: SoundProfile;
  sustain: boolean;
  octaveOffset: number;
  showInstrumentSelector: boolean;
  showSettings: boolean;
  showProjectManager: boolean;
  showSaveModal: boolean;
  activeView: 'piano' | 'sequencer';
  
  // Project Metadata
  currentProjectId: string | null;
  currentProjectName: string | null;
  savedProjects: Project[];
  
  // Settings
  volume: number;
  reverb: number;
  bass: number;
  pitch: number;
  timbre: number;
  showKeyLabels: boolean;
  animationIntensity: number;
  totalBeats: number;
  totalDuration: number;
  zoom: number;
  
  notes: NoteEvent[];
  recordedNotes: NoteEvent[];
  
  // Actions
  setBpm: (bpm: number) => void;
  togglePlay: () => void;
  toggleRecord: () => void;
  setSound: (sound: SoundProfile) => void;
  setSustain: (sustain: boolean) => void;
  setOctaveOffset: (offset: number) => void;
  setShowInstrumentSelector: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowProjectManager: (show: boolean) => void;
  setShowSaveModal: (show: boolean) => void;
  setActiveView: (view: 'piano' | 'sequencer') => void;
  setVolume: (vol: number) => void;
  setReverb: (rev: number) => void;
  setBass: (bass: number) => void;
  setPitch: (pitch: number) => void;
  setTimbre: (timbre: number) => void;
  setShowKeyLabels: (show: boolean) => void;
  setAnimationIntensity: (val: number) => void;
  setTotalBeats: (beats: number) => void;
  setTotalDuration: (seconds: number) => void;
  setZoom: (zoom: number) => void;
  addNote: (note: NoteEvent) => void;
  updateNote: (id: string, updates: Partial<NoteEvent>) => void;
  updateNoteDuration: (id: string, duration: number) => void;
  toggleHold: (id: string) => void;
  removeNote: (id: string) => void;
  clearNotes: () => void;
  createNewProject: () => void;
  saveProject: (name?: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  exportProject: () => void;
  importProject: (projectData: any) => string | null;
  importMidi: (midiData: ArrayBuffer, fileName: string) => Promise<string | null>;
}

export const usePianoStore = create<PianoState>()(
  persist(
    (set, get) => ({
      bpm: 120,
      isPlaying: false,
      isRecording: false,
      currentSound: 'grand-piano',
      sustain: false,
      octaveOffset: 0,
      showInstrumentSelector: false,
      showSettings: false,
      showProjectManager: false,
      showSaveModal: false,
      activeView: 'sequencer',
      
      currentProjectId: null,
      currentProjectName: null,
      savedProjects: [],
      
      volume: 0.5,
      reverb: 0.3,
      bass: 0.5,
      pitch: 0.5,
      timbre: 0.5,
      showKeyLabels: true,
      animationIntensity: 1,
      totalBeats: 32,
      totalDuration: 16,
      zoom: 1,
      
      notes: [],
      recordedNotes: [],

      setBpm: (bpm) => {
        const state = get();
        const beats = (state.totalDuration * bpm) / 60;
        set({ bpm, totalBeats: beats });
      },
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      toggleRecord: () => set((state) => ({ isRecording: !state.isRecording })),
      setSound: (currentSound) => set({ currentSound, showInstrumentSelector: false }),
      setSustain: (sustain) => set({ sustain }),
      setOctaveOffset: (octaveOffset) => set({ octaveOffset }),
      setShowInstrumentSelector: (showInstrumentSelector) => set({ showInstrumentSelector }),
      setShowSettings: (showSettings) => set({ showSettings }),
      setShowProjectManager: (showProjectManager) => set({ showProjectManager }),
      setShowSaveModal: (showSaveModal) => set({ showSaveModal }),
      setActiveView: (activeView) => set({ activeView }),
      setVolume: (volume) => set({ volume }),
      setReverb: (reverb) => set({ reverb }),
      setBass: (bass) => set({ bass }),
      setPitch: (pitch) => set({ pitch }),
      setTimbre: (timbre) => set({ timbre }),
      setShowKeyLabels: (showKeyLabels) => set({ showKeyLabels }),
      setAnimationIntensity: (animationIntensity) => set({ animationIntensity }),
      setTotalBeats: (totalBeats: number) => set({ totalBeats }),
      setTotalDuration: (totalDuration: number) => {
        const state = get();
        const beats = (totalDuration * state.bpm) / 60;
        set({ totalDuration, totalBeats: beats });
      },
      setZoom: (zoom: number) => set({ zoom }),
      addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
      })),
      updateNoteDuration: (id, duration) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, duration: Math.max(0.25, duration) } : n)
      })),
      toggleHold: (id) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, hold: !n.hold } : n)
      })),
      removeNote: (id) => set((state) => ({ notes: state.notes.filter(n => n.id !== id) })),
      clearNotes: () => set({ notes: [] }),
      
      createNewProject: () => {
        set({
          notes: [],
          currentProjectId: null,
          currentProjectName: null,
          isPlaying: false,
          isRecording: false
        });
      },

      saveProject: (name) => {
        const state = get();
        const existingId = state.currentProjectId;
        const finalName = name || state.currentProjectName;
        
        if (!finalName) return;

        const newProject: Project = {
          id: existingId || Math.random().toString(36).substr(2, 9),
          name: finalName,
          notes: state.notes,
          bpm: state.bpm,
          currentSound: state.currentSound,
          totalBeats: state.totalBeats,
          volume: state.volume,
          bass: state.bass,
          updatedAt: Date.now()
        };

        set((state) => {
          const otherProjects = state.savedProjects.filter(p => p.id !== newProject.id);
          return {
            savedProjects: [newProject, ...otherProjects],
            currentProjectId: newProject.id,
            currentProjectName: newProject.name
          };
        });
      },
      
      loadProject: (id) => {
        const state = get();
        const project = state.savedProjects.find(p => p.id === id);
        if (project) {
          set({
            notes: project.notes,
            bpm: project.bpm,
            currentSound: project.currentSound,
            totalBeats: project.totalBeats,
            volume: project.volume,
            bass: project.bass,
            currentProjectId: project.id,
            currentProjectName: project.name,
            showProjectManager: false,
            isPlaying: false
          });
        }
      },

      deleteProject: (id) => {
        set((state) => {
          const isCurrent = state.currentProjectId === id;
          return {
            savedProjects: state.savedProjects.filter(p => p.id !== id),
            currentProjectId: isCurrent ? null : state.currentProjectId,
            currentProjectName: isCurrent ? null : state.currentProjectName,
            notes: isCurrent ? [] : state.notes
          };
        });
      },

      exportProject: () => {
        const state = get();
        const projectData = {
          name: state.currentProjectName || 'Untitled Project',
          notes: state.notes,
          bpm: state.bpm,
          currentSound: state.currentSound,
          totalBeats: state.totalBeats,
          volume: state.volume,
          bass: state.bass,
          exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectData.name.toLowerCase().replace(/\s+/g, '_')}_virtuoso.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      importProject: (projectData) => {
        if (!projectData || !projectData.notes) return null;

        const newProject: Project = {
          id: Math.random().toString(36).substr(2, 9),
          name: projectData.name || 'Imported Project',
          notes: projectData.notes,
          bpm: projectData.bpm || 120,
          currentSound: projectData.currentSound || 'grand-piano',
          totalBeats: projectData.totalBeats || 32,
          volume: projectData.volume || 0.5,
          bass: projectData.bass || 0.5,
          updatedAt: Date.now()
        };

        set((state) => ({
          savedProjects: [newProject, ...state.savedProjects]
        }));

        return newProject.id;
      },

      importMidi: async (midiData, fileName) => {
        try {
          const { Midi } = await import('@tonejs/midi');
          const midi = new Midi(midiData);
          
          const importedNotes: NoteEvent[] = [];
          let maxBeat = 0;

          midi.tracks.forEach(track => {
            track.notes.forEach(note => {
              const startBeat = note.ticks / midi.header.ppq;
              const durationBeats = note.durationTicks / midi.header.ppq;
              
              importedNotes.push({
                id: Math.random().toString(36).substr(2, 9),
                note: note.midi,
                startTime: Math.round(startBeat * 4) / 4, // Quantize to 1/16th
                duration: Math.round(durationBeats * 4) / 4,
                velocity: note.velocity,
                hold: false
              });

              maxBeat = Math.max(maxBeat, startBeat + durationBeats);
            });
          });

          if (importedNotes.length === 0) return null;

          const newProject: Project = {
            id: Math.random().toString(36).substr(2, 9),
            name: fileName.replace(/\.[^/.]+$/, ""),
            notes: importedNotes,
            bpm: Math.round(midi.header.tempos[0]?.bpm || 120),
            currentSound: 'grand-piano',
            totalBeats: Math.ceil(maxBeat / 8) * 8 || 32,
            volume: 0.5,
            bass: 0.5,
            updatedAt: Date.now()
          };

          set((state) => ({
            savedProjects: [newProject, ...state.savedProjects]
          }));

          return newProject.id;
        } catch (error) {
          console.error('Failed to import MIDI:', error);
          return null;
        }
      }
    }),
    {
      name: 'virtuoso-piano-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedProjects: state.savedProjects,
        showKeyLabels: state.showKeyLabels,
        bpm: state.bpm,
        currentSound: state.currentSound,
        volume: state.volume,
        bass: state.bass,
        totalBeats: state.totalBeats,
        notes: state.notes,
        zoom: state.zoom,
        currentProjectId: state.currentProjectId,
        currentProjectName: state.currentProjectName,
        activeView: state.activeView
      }),
    }
  )
);
