import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Music, Trash2, Clock, Play, Upload } from 'lucide-react';
import { usePianoStore } from '../store/usePianoStore';

export const ProjectManager: React.FC = () => {
  const { 
    showProjectManager, 
    setShowProjectManager, 
    savedProjects, 
    loadProject, 
    deleteProject,
    currentProjectId,
    importProject,
    importMidi
  } = usePianoStore();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const isMidi = file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let newId: string | null = null;
        if (isMidi) {
          const buffer = event.target?.result as ArrayBuffer;
          newId = await importMidi(buffer, file.name);
        } else {
          const json = JSON.parse(event.target?.result as string);
          newId = importProject(json);
        }

        if (newId) {
          loadProject(newId);
        }
      } catch (err) {
        alert(isMidi ? 'Failed to parse MIDI file' : 'Invalid project file format');
      } finally {
        setIsImporting(false);
      }
    };

    if (isMidi) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
    e.target.value = ''; // Reset for next import
  };

  if (!showProjectManager) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            setShowProjectManager(false);
            setConfirmDeleteId(null);
          }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Music className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Saved Play Notes</h2>
                <p className="text-sm text-white/40">Manage your musical compositions (.json, .mid)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json,.mid,.midi"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all border border-white/5"
              >
                <Upload className={`w-4 h-4 text-indigo-400 ${isImporting ? 'animate-bounce' : ''}`} />
                {isImporting ? 'Importing...' : 'Import'}
              </button>
              <button
                onClick={() => {
                  setShowProjectManager(false);
                  setConfirmDeleteId(null);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Project List */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {savedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Music className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-white/60 font-medium">No saved notes yet</h3>
                <p className="text-white/30 text-sm max-w-[200px] mt-1">
                  Compose something and hit the save button to see it here.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {savedProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all ${
                      currentProjectId === project.id 
                        ? 'bg-indigo-500/10 border-indigo-500/30' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        currentProjectId === project.id ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/40'
                      }`}>
                        <Music className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate">{project.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-white/30 uppercase font-black">
                            <Clock className="w-3 h-3" />
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-white/20 font-black uppercase">
                            {project.notes.length} Notes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {confirmDeleteId === project.id ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                          <span className="text-[10px] font-bold text-red-400 uppercase mr-1">Delete?</span>
                          <button
                            onClick={() => {
                              deleteProject(project.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => loadProject(project.id)}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] sm:text-xs font-bold rounded-lg flex items-center gap-1.5 sm:gap-2 transition-colors"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Load
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(project.id);
                            }}
                            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5">
            <p className="text-[10px] text-center text-white/20 uppercase font-black tracking-widest">
              Virtuoso Workstation v2.1.0 • Local Storage Active
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
