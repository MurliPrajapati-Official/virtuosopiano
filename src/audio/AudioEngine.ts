/**
 * Core Audio Engine for Virtuoso Piano
 * Implements low-latency Web Audio API synthesis and sample management
 */

export class AudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private lowPass: BiquadFilterNode;
  private timbreFilter: BiquadFilterNode;
  private bassShelf: BiquadFilterNode;
  private samples: Map<number, AudioBuffer> = new Map();
  private activeVoices: Map<string, { source: AudioNode; gain: GainNode; startTime: number }> = new Map();
  private isLoadingSamples: boolean = false;
  private pitchOffset: number = 0; // in semitones
  private timbreValue: number = 0.5;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
      latencyHint: 'interactive',
    });

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    
    // Tone control (Low Pass) - General warmth
    this.lowPass = this.ctx.createBiquadFilter();
    this.lowPass.type = 'lowpass';
    this.lowPass.frequency.value = 20000;
    this.lowPass.Q.value = 0.7;

    // Timbre control (High Shelf or Peaking) - Brightness/Character
    this.timbreFilter = this.ctx.createBiquadFilter();
    this.timbreFilter.type = 'highshelf';
    this.timbreFilter.frequency.value = 2000;
    this.timbreFilter.gain.value = 0;

    // Bass boost (Low Shelf)
    this.bassShelf = this.ctx.createBiquadFilter();
    this.bassShelf.type = 'lowshelf';
    this.bassShelf.frequency.value = 200;
    this.bassShelf.gain.value = 0;

    this.masterGain.connect(this.bassShelf);
    this.bassShelf.connect(this.timbreFilter);
    this.timbreFilter.connect(this.lowPass);
    this.lowPass.connect(this.ctx.destination);
    
    // Pre-load a few essential samples for "Grand Piano"
    this.loadPianoSamples();
  }

  public setPitch(value: number) {
    // value is 0-1, map to -12 to +12 semitones
    this.pitchOffset = (value - 0.5) * 24;
  }

  public setTimbre(value: number) {
    this.timbreValue = value;
    const now = this.ctx.currentTime;
    
    // Timbre affects High Shelf gain and Low Pass frequency
    // Gain: -12dB to +12dB (more subtle than 40dB)
    const shelfGain = (value - 0.5) * 24;
    this.timbreFilter.gain.setTargetAtTime(shelfGain, now, 0.1);
    
    // Resonance: 0.7 to 2.5 (very subtle to avoid ringing)
    const resonance = 0.7 + (value * 1.8);
    this.lowPass.Q.setTargetAtTime(resonance, now, 0.1);

    // Cutoff: 3000Hz to 19000Hz (higher starting point for more clarity)
    const lpFreq = 3000 + (16000 * value);
    this.lowPass.frequency.setTargetAtTime(lpFreq, now, 0.1);
  }

  private async loadPianoSamples() {
    if (this.isLoadingSamples) return;
    this.isLoadingSamples = true;
    
    // We'll load a few key notes and pitch shift others to save bandwidth
    const notesToLoad = [48, 60, 72, 84]; // C3, C4, C5, C6
    const baseUrl = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3';
    
    const noteNames: Record<number, string> = {
      48: 'C3', 60: 'C4', 72: 'C5', 84: 'C6'
    };

    for (const midi of notesToLoad) {
      try {
        const response = await fetch(`${baseUrl}/${noteNames[midi]}.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.samples.set(midi, audioBuffer);
      } catch (e) {
        console.error(`Failed to load sample for ${noteNames[midi]}`, e);
      }
    }
    this.isLoadingSamples = false;
  }

  public async resume() {
    if (this.ctx.state !== 'running') {
      await this.ctx.resume();
    }
    // Ensure samples are loaded if they failed initially
    if (this.samples.size === 0) {
      await this.loadPianoSamples();
    }
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private getClosestSample(midi: number): { buffer: AudioBuffer; playbackRate: number } | null {
    if (this.samples.size === 0) return null;
    
    let closestMidi = -1;
    let minDiff = Infinity;
    
    for (const sampleMidi of this.samples.keys()) {
      const diff = Math.abs(midi - sampleMidi);
      if (diff < minDiff) {
        minDiff = diff;
        closestMidi = sampleMidi;
      }
    }
    
    const buffer = this.samples.get(closestMidi)!;
    const playbackRate = Math.pow(2, (midi - closestMidi) / 12);
    
    return { buffer, playbackRate };
  }

  public playNote(midi: number, velocity: number = 0.8, type: string = 'grand-piano', duration?: number, voiceId?: string, hold: boolean = false) {
    this.resume();
    const now = this.ctx.currentTime;
    
    // Use voiceId if provided (sequencer), otherwise use midi string (keyboard)
    const key = voiceId || midi.toString();
    this.stopNote(key);

    const gain = this.ctx.createGain();
    gain.connect(this.masterGain);

    let source: AudioNode;

    // Try sample-based for grand piano
    if (type === 'grand-piano') {
      const sample = this.getClosestSample(midi + this.pitchOffset);
      if (sample) {
        const bufferSource = this.ctx.createBufferSource();
        bufferSource.buffer = sample.buffer;
        bufferSource.playbackRate.value = sample.playbackRate;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(velocity, now + 0.005);
        
        if (duration) {
          const stopTime = now + duration;
          if (hold) {
            // Hold: Sustain at velocity until near the end
            gain.gain.setValueAtTime(velocity, stopTime - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, stopTime);
          } else {
            // Natural decay
            gain.gain.exponentialRampToValueAtTime(0.01, stopTime);
          }
          bufferSource.start(now);
          bufferSource.stop(stopTime + 0.1);
        } else {
          gain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);
          bufferSource.start(now);
        }
        
        source = bufferSource;
        source.connect(gain);
        this.activeVoices.set(key.toString(), { source, gain, startTime: now });
        return;
      }
    }

    // Fallback to synthesis
    const osc = this.ctx.createOscillator();
    const freq = this.midiToFreq(midi + this.pitchOffset);
    osc.frequency.setValueAtTime(freq, now);

    switch (type) {
      case 'electric-piano':
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(velocity, now + 0.01);
        if (duration) {
          if (hold) {
            gain.gain.setValueAtTime(velocity, now + duration - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
          } else {
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
          }
        } else {
          gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);
        }
        break;
      case 'synth-lead':
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(velocity * 0.4, now + 0.01);
        if (duration) {
          if (hold) {
            gain.gain.setValueAtTime(velocity * 0.4, now + duration - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
          } else {
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
          }
        } else {
          gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        }
        break;
      case 'pad':
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(velocity * 0.3, now + 0.5);
        if (duration) {
          if (hold) {
            gain.gain.setValueAtTime(velocity * 0.3, now + duration - 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
          } else {
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
          }
        } else {
          gain.gain.exponentialRampToValueAtTime(0.01, now + 4.0);
        }
        break;
      default:
        osc.type = 'sine';
        gain.gain.setValueAtTime(velocity, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
    }

    source = osc;
    osc.connect(gain);
    osc.start(now);
    if (duration) {
      osc.stop(now + duration + 0.1);
    }
    this.activeVoices.set(key.toString(), { source, gain, startTime: now });
  }

  public stopNote(key: number | string) {
    const voice = this.activeVoices.get(key.toString());
    if (voice) {
      const now = this.ctx.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.setTargetAtTime(0, now, 0.05);
      
      setTimeout(() => {
        try {
          if (voice.source instanceof OscillatorNode) {
            voice.source.stop();
          } else if (voice.source instanceof AudioBufferSourceNode) {
            voice.source.stop();
          }
          voice.source.disconnect();
          voice.gain.disconnect();
        } catch (e) {}
      }, 200);
      
      this.activeVoices.delete(key.toString());
    }
  }

  public setMasterVolume(value: number) {
    this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.1);
  }

  public setBass(value: number) {
    // Low Shelf: Boost low frequencies (0 to +8dB) - even more subtle
    const shelfGain = value * 8;
    this.bassShelf.gain.setTargetAtTime(shelfGain, this.ctx.currentTime, 0.1);
  }
}

export const engine = new AudioEngine();
