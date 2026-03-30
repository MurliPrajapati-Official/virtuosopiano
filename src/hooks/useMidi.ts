import { useEffect } from 'react';
import { engine } from '../audio/AudioEngine';
import { usePianoStore } from '../store/usePianoStore';

export function useMidi() {
  const currentSound = usePianoStore((state) => state.currentSound);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not supported in this browser');
      return;
    }

    const onMIDIMessage = (event: WebMidi.MIDIMessageEvent) => {
      const [status, note, velocity] = event.data;
      const type = status & 0xf0;
      
      if (type === 0x90 && velocity > 0) {
        // Note On
        engine.playNote(note, velocity / 127, currentSound);
      } else if (type === 0x80 || (type === 0x90 && velocity === 0)) {
        // Note Off
        engine.stopNote(note);
      }
    };

    const onMIDISuccess = (midiAccess: WebMidi.MIDIAccess) => {
      for (const input of midiAccess.inputs.values()) {
        input.onmidimessage = onMIDIMessage;
      }

      midiAccess.onstatechange = (e) => {
        if (e.port.type === 'input' && e.port.state === 'connected') {
          (e.port as WebMidi.MIDIInput).onmidimessage = onMIDIMessage;
        }
      };
    };

    const onMIDIFailure = () => {
      console.warn('Could not access MIDI devices');
    };

    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }, [currentSound]);
}
