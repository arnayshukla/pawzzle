export function playSound(type: 'click' | 'win' | 'invalid') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'invalid') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'win') {
      // Simple arpeggio
      const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      let startTime = ctx.currentTime;
      
      freqs.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.connect(g);
        g.connect(ctx.destination);
        
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        o.start(startTime);
        o.stop(startTime + 0.5);
        
        startTime += 0.1;
      });
    }
  } catch (e) {
    // Ignore audio context errors
  }
}

export function triggerVibration(type: 'light' | 'heavy' | 'success') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  
  try {
    if (type === 'light') {
      navigator.vibrate(10);
    } else if (type === 'heavy') {
      navigator.vibrate(40);
    } else if (type === 'success') {
      navigator.vibrate([30, 50, 30]);
    }
  } catch (e) {
    // Ignore vibration errors
  }
}
