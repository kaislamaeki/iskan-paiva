// Background music: a calm, jazzy chiptune generated live with Web Audio.
// Swung eighths, seventh chords, a walking bass, soft "electric piano" comping,
// ride cymbal and hi-hat. No audio files needed.
// It starts after the first tap / key press (browsers require that).
const MUSIC = (() => {
  const TEMPO = 96;                   // beats per minute (calm)
  const BEAT = 60 / TEMPO;
  const SWING = 2 / 3;                // the "and" lands 2/3 into the beat (triplet swing)

  // note name -> frequency, e.g. 'C4', 'F#3'
  const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const midi = (n) => {
    const m = n.match(/^([A-G]#?)(\d)$/);
    return SEMI[m[1]] + (+m[2] + 1) * 12;
  };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // 16 bars: chord symbol, bass root, chord voicing (soft, low)
  const BARS = [
    ['maj7', 'C2', ['E3', 'G3', 'B3', 'D4']],   // Cmaj7
    ['m7', 'A2', ['G3', 'C4', 'E4']],           // Am7
    ['m7', 'D2', ['F3', 'A3', 'C4', 'E4']],     // Dm7
    ['7', 'G2', ['F3', 'B3', 'E4']],            // G7
    ['maj7', 'C2', ['E3', 'G3', 'B3', 'D4']],   // Cmaj7
    ['7', 'A2', ['G3', 'C#4', 'E4']],           // A7
    ['m7', 'D2', ['F3', 'A3', 'C4', 'E4']],     // Dm7
    ['7', 'G2', ['F3', 'B3', 'E4']],            // G7
    ['maj7', 'F2', ['A3', 'C4', 'E4']],         // Fmaj7
    ['m7', 'F2', ['G#3', 'C4', 'D#4']],         // Fm7
    ['m7', 'E2', ['G3', 'B3', 'D4']],           // Em7
    ['7', 'A2', ['G3', 'C#4', 'E4']],           // A7
    ['m7', 'D2', ['F3', 'A3', 'C4', 'E4']],     // Dm7
    ['7', 'G2', ['F3', 'B3', 'E4']],            // G7
    ['maj7', 'C2', ['E3', 'G3', 'B3', 'D4']],   // Cmaj7
    ['7', 'G2', ['F3', 'B3', 'D4']],            // G7 turnaround
  ];

  // Melody: [note, length in eighths]; 'R' = rest. 8 eighths per bar.
  const MELODY = [
    ['R', 2], ['E4', 1], ['G4', 1], ['B4', 3], ['A4', 1],
    ['G4', 2], ['E4', 2], ['C5', 3], ['R', 1],
    ['R', 1], ['D4', 1], ['F4', 1], ['A4', 1], ['C5', 2], ['B4', 1], ['A4', 1],
    ['G4', 4], ['F4', 1], ['D4', 1], ['B3', 2],
    ['R', 2], ['E4', 1], ['G4', 1], ['B4', 2], ['D5', 2],
    ['C#5', 3], ['B4', 1], ['A4', 2], ['G4', 2],
    ['F4', 2], ['A4', 1], ['C5', 1], ['E5', 3], ['D5', 1],
    ['D5', 2], ['B4', 2], ['G4', 2], ['R', 2],
    ['R', 1], ['A4', 1], ['C5', 1], ['E5', 1], ['G5', 2], ['E5', 2],
    ['G#4', 3], ['G4', 1], ['F4', 2], ['D#4', 2],
    ['E4', 2], ['G4', 1], ['B4', 1], ['D5', 3], ['C5', 1],
    ['C#5', 2], ['E5', 2], ['G4', 2], ['F4', 1], ['E4', 1],
    ['D5', 2], ['C5', 1], ['A4', 1], ['F4', 2], ['A4', 2],
    ['B4', 1], ['D5', 1], ['F4', 1], ['D4', 1], ['B3', 2], ['G4', 2],
    ['C5', 3], ['E4', 1], ['G4', 2], ['B4', 2],
    ['A4', 1], ['G4', 1], ['F4', 1], ['D4', 1], ['B3', 2], ['R', 2],
  ];
  const mel = [];  // what starts on each eighth
  for (const [n, len] of MELODY) {
    mel.push(n === 'R' ? null : { m: midi(n), len });
    for (let i = 1; i < len; i++) mel.push(null);
  }
  const EIGHTHS = mel.length;       // 128 = 16 bars

  // Walking bass: root, third, fifth, then a half step towards the next chord
  const THIRD = { maj7: 4, m7: 3, 7: 4 };
  function bassNote(bar, beat) {
    const [q, root] = BARS[bar];
    const r = midi(root);
    if (beat === 0) return r;
    if (beat === 1) return r + THIRD[q];
    if (beat === 2) return r + 7;
    const next = midi(BARS[(bar + 1) % BARS.length][1]);
    return next + (next > r + 7 ? -1 : 1);
  }

  // time of an eighth inside the loop (swung)
  const eighthTime = (i) => Math.floor(i / 2) * BEAT + (i % 2 ? BEAT * SWING : 0);
  const LOOP_LEN = BARS.length * 4 * BEAT;

  let ctx = null, out = null, noise = null, timer = null;
  let step = 0, loopStart = 0;

  function voice(type, f, t, dur, vol, cutoff) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(vol * 0.5, t + Math.min(dur, 0.4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (cutoff) {
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = cutoff;
      node = o.connect(f2);
    }
    node.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function noiseHit(t, filterType, freqHz, dur, vol) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const flt = ctx.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.value = freqHz;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(g).connect(out);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function kick(t) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.2);
  }

  function schedule(i, t) {
    const bar = Math.floor(i / 8), e = i % 8, beat = Math.floor(e / 2), off = e % 2 === 1;
    // melody: soft triangle
    const n = mel[i];
    if (n) voice('triangle', hz(n.m), t, (eighthTime(i + n.len) - eighthTime(i)) * 0.95, 0.22);
    if (!off) {
      // walking bass on every beat
      voice('triangle', hz(bassNote(bar, beat)), t, BEAT * 0.9, 0.32);
      // ride cymbal "ding" on every beat, hi-hat chick on 2 and 4
      noiseHit(t, 'highpass', 6500, 0.16, 0.03);
      if (beat === 1 || beat === 3) noiseHit(t, 'highpass', 9000, 0.03, 0.035);
      if (beat === 0) kick(t);
    } else if (beat === 1 || beat === 3) {
      // the swung "ga" of the ride: ding ding-ga ding ding-ga
      noiseHit(t, 'highpass', 6500, 0.08, 0.02);
    }
    // electric-piano comping: on beat 1 and the swung "and" of 2 (Charleston)
    if ((e === 0) || (e === 3)) {
      const dur = e === 0 ? BEAT * 0.9 : BEAT * 1.3;
      for (const c of BARS[bar][2]) voice('square', hz(midi(c)), t, dur, 0.022, 1000);
    }
  }

  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (loopStart + eighthTime(step) < now) { loopStart = now + 0.05 - eighthTime(step); }
    while (loopStart + eighthTime(step) < now + 0.25) {
      schedule(step, loopStart + eighthTime(step));
      step++;
      if (step >= EIGHTHS) { step = 0; loopStart += LOOP_LEN; }
    }
  }

  return {
    // destination: the node the music plays into (SOUND's master volume)
    start(audioCtx, destination, volume) {
      if (timer || !audioCtx) return;
      ctx = audioCtx;
      out = ctx.createGain();
      out.gain.value = volume;
      out.connect(destination);
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      loopStart = 0;
      timer = setInterval(tick, 25);
    },
  };
})();
