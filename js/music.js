// Background music: a light, happy chiptune generated live with Web Audio
// (square-wave melody, triangle bass, soft noise drums). No audio files needed.
// It starts after the first tap / key press (browsers require that).
const MUSIC = (() => {
  const TEMPO = 140;                  // beats per minute
  const STEP = 60 / TEMPO / 2;        // one eighth note (s)

  // note name -> frequency, e.g. 'C5', 'F#4'
  const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const freq = (n) => {
    const m = n.match(/^([A-G]#?)(\d)$/);
    return 440 * Math.pow(2, (SEMI[m[1]] + (+m[2] + 1) * 12 - 69) / 12);
  };

  // Melody: [note, length in eighths]; 'R' = rest. 16 bars of 8 eighths.
  const MELODY = [
    // A part: C  G  Am  F  |  C  G  F  G
    ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1], ['C6', 2], ['G5', 1], ['E5', 1],
    ['D5', 1], ['G5', 1], ['B5', 1], ['G5', 1], ['D6', 2], ['B5', 2],
    ['C6', 1], ['B5', 1], ['A5', 1], ['E5', 1], ['A5', 2], ['C6', 2],
    ['A5', 1], ['G5', 1], ['F5', 1], ['A5', 1], ['G5', 4],
    ['E5', 2], ['G5', 1], ['C6', 1], ['E6', 2], ['D6', 1], ['C6', 1],
    ['B5', 2], ['D6', 1], ['B5', 1], ['G5', 2], ['A5', 1], ['B5', 1],
    ['C6', 1], ['A5', 1], ['F5', 1], ['A5', 1], ['G5', 1], ['F5', 1], ['E5', 1], ['D5', 1],
    ['D5', 1], ['E5', 1], ['F5', 1], ['G5', 1], ['B5', 2], ['D6', 2],
    // B part: F  G  Em  Am  |  F  G  C  C
    ['A5', 2], ['C6', 2], ['F6', 2], ['E6', 1], ['D6', 1],
    ['D6', 2], ['B5', 2], ['G5', 2], ['A5', 1], ['B5', 1],
    ['G5', 2], ['B5', 2], ['E6', 3], ['D6', 1],
    ['C6', 2], ['A5', 2], ['E5', 4],
    ['F5', 1], ['A5', 1], ['C6', 1], ['A5', 1], ['F6', 2], ['E6', 1], ['D6', 1],
    ['D6', 1], ['B5', 1], ['G5', 1], ['B5', 1], ['D6', 2], ['G6', 2],
    ['E6', 1], ['D6', 1], ['C6', 1], ['G5', 1], ['E5', 1], ['G5', 1], ['C6', 2],
    ['C6', 4], ['R', 2], ['G5', 1], ['B5', 1],
  ];
  // Bass root per bar (bounces between the root and its octave)
  const BASS = ['C3', 'G2', 'A2', 'F2', 'C3', 'G2', 'F2', 'G2', 'F2', 'G2', 'E2', 'A2', 'F2', 'G2', 'C3', 'C3'];

  // flatten the melody into "what starts on each eighth"
  const steps = [];
  for (const [n, len] of MELODY) {
    steps.push(n === 'R' ? null : { f: freq(n), len });
    for (let i = 1; i < len; i++) steps.push(null);
  }
  const LOOP = steps.length; // 128 eighths = 16 bars

  let ctx = null, out = null, noise = null, timer = null;
  let step = 0, nextTime = 0;

  function tone(type, f, t, dur, vol) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(vol * 0.6, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function hit(t, filterType, freqHz, dur, vol) {
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
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.16);
  }

  function schedule(i, t) {
    const s = steps[i];
    if (s) tone('square', s.f, t, s.len * STEP * 0.92, 0.11);
    const bar = Math.floor(i / 8), beat8 = i % 8;
    const root = freq(BASS[bar]);
    tone('triangle', beat8 % 2 ? root * 2 : root, t, STEP * 0.9, 0.28);
    hit(t, 'highpass', 7000, 0.03, beat8 % 2 ? 0.05 : 0.03);           // hi-hat
    if (beat8 === 0 || beat8 === 4) kick(t);
    if (beat8 === 2 || beat8 === 6) hit(t, 'bandpass', 1800, 0.09, 0.14); // snare
  }

  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.2) {
      schedule(step, nextTime);
      nextTime += STEP;
      step = (step + 1) % LOOP;
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
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      nextTime = 0;
      timer = setInterval(tick, 25);
    },
  };
})();
