// Background music: jazzy chiptune tracks generated live with Web Audio. No audio files.
//   main  – light, catchy, swinging (story mode)
//   chaos – same style, but faster, minor, busier and a little unpredictable (chaos mode)
// Music starts after the first tap / key press (browsers require that).
const MUSIC = (() => {
  // note name -> midi number / frequency
  const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const midi = (n) => {
    const m = n.match(/^([A-G]#?)(\d)$/);
    return SEMI[m[1]] + (+m[2] + 1) * 12;
  };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const THIRD = { maj7: 4, m7: 3, 7: 4, m7b5: 3 };
  const FIFTH = { maj7: 7, m7: 7, 7: 7, m7b5: 6 };

  // ---------- tracks ----------
  // bars: [chord quality, bass root, chord voicing]; melody: [note, length in eighths], 8 per bar
  const TRACKS = {
    main: {
      tempo: 112, swing: 2 / 3,
      lead: { type: 'triangle', vol: 0.25 },
      bars: [
        ['maj7', 'C2', ['E3', 'G3', 'B3', 'D4']], ['m7', 'A2', ['G3', 'C4', 'E4']],
        ['m7', 'D2', ['F3', 'A3', 'C4', 'E4']], ['7', 'G2', ['F3', 'B3', 'E4']],
        ['maj7', 'C2', ['E3', 'G3', 'B3', 'D4']], ['7', 'A2', ['G3', 'C#4', 'E4']],
        ['m7', 'D2', ['F3', 'A3', 'C4', 'E4']], ['7', 'G2', ['F3', 'B3', 'E4']],
        ['maj7', 'F2', ['A3', 'C4', 'E4']], ['m7', 'F2', ['G#3', 'C4', 'D#4']],
        ['m7', 'E2', ['G3', 'B3', 'D4']], ['7', 'A2', ['G3', 'C#4', 'E4']],
        ['m7', 'D2', ['F3', 'A3', 'C4', 'E4']], ['7', 'G2', ['F3', 'B3', 'E4']],
        ['maj7', 'C2', ['E3', 'G3', 'B3', 'D4']], ['7', 'G2', ['F3', 'B3', 'D4']],
      ],
      melody: [
        // A: the hook (bars 1-2), an answer (3-4), the hook again (5-6), a run down (7-8)
        ['E4', 1], ['G4', 1], ['A4', 1], ['C5', 2], ['A4', 1], ['C5', 1], ['D5', 1],
        ['E5', 3], ['D5', 1], ['C5', 2], ['R', 2],
        ['F4', 1], ['A4', 1], ['C5', 1], ['D5', 2], ['C5', 1], ['A4', 1], ['F4', 1],
        ['G4', 3], ['B4', 1], ['D5', 2], ['R', 2],
        ['E4', 1], ['G4', 1], ['A4', 1], ['C5', 2], ['A4', 1], ['C5', 1], ['D5', 1],
        ['E5', 3], ['C#5', 1], ['E5', 2], ['R', 2],
        ['F5', 2], ['E5', 1], ['D5', 1], ['C5', 1], ['A4', 1], ['F4', 2],
        ['B4', 1], ['D5', 1], ['F5', 1], ['D5', 1], ['G4', 2], ['R', 2],
        // B: a second little phrase, repeated one step lower, then back to the hook
        ['A4', 1], ['C5', 1], ['E5', 2], ['R', 1], ['A4', 1], ['C5', 1], ['E5', 1],
        ['D#5', 3], ['C5', 1], ['G#4', 2], ['R', 2],
        ['G4', 1], ['B4', 1], ['D5', 2], ['R', 1], ['G4', 1], ['B4', 1], ['D5', 1],
        ['C#5', 3], ['E5', 1], ['G5', 2], ['R', 2],
        ['F5', 1], ['E5', 1], ['D5', 1], ['C5', 1], ['A4', 2], ['D5', 2],
        ['B4', 1], ['A4', 1], ['G4', 1], ['F4', 1], ['D4', 2], ['G4', 2],
        ['E4', 1], ['G4', 1], ['A4', 1], ['C5', 2], ['A4', 1], ['C5', 1], ['D5', 1],
        ['E5', 3], ['D5', 1], ['B4', 2], ['R', 2],
      ],
      comp: (e) => e === 0 || e === 3,          // Charleston: beat 1 and the "and" of 2
      drums: 'ride',
      chaos: false,
    },

    chaos: {
      tempo: 160, swing: 0.62,
      lead: { type: 'square', vol: 0.12, cutoff: 2200 },
      bars: [
        ['m7', 'A2', ['G3', 'C4', 'E4']], ['7', 'D2', ['F#3', 'C4', 'E4']],
        ['m7', 'G2', ['F3', 'A#3', 'D4']], ['7', 'C2', ['E3', 'A#3', 'D4']],
        ['maj7', 'F2', ['A3', 'C4', 'E4']], ['7', 'A#2', ['D4', 'G#3', 'C4']],
        ['7', 'E2', ['G#3', 'D4', 'F4']], ['7', 'E2', ['G#3', 'D4', 'G4']],
        ['m7', 'A2', ['G3', 'C4', 'E4']], ['m7b5', 'F#2', ['E3', 'A3', 'C4']],
        ['7', 'B2', ['A3', 'D#4', 'F#4']], ['7', 'E2', ['G#3', 'D4', 'F4']],
        ['m7', 'A2', ['G3', 'C4', 'E4']], ['7', 'C2', ['E3', 'A#3', 'D4']],
        ['7', 'F2', ['A3', 'D#4', 'G4']], ['7', 'E2', ['G#3', 'D4', 'F4']],
      ],
      melody: [
        ['A4', 1], ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1], ['C5', 1], ['A4', 1], ['G#4', 1],
        ['A4', 1], ['F#4', 1], ['A4', 1], ['C5', 1], ['D5', 2], ['R', 2],
        ['G4', 1], ['A#4', 1], ['D5', 1], ['F5', 1], ['D5', 1], ['A#4', 1], ['G4', 1], ['F#4', 1],
        ['G4', 1], ['E4', 1], ['G4', 1], ['A#4', 1], ['C5', 2], ['R', 2],
        ['F4', 1], ['A4', 1], ['C5', 1], ['E5', 1], ['F5', 2], ['E5', 1], ['D5', 1],
        ['D5', 1], ['C5', 1], ['A#4', 1], ['G#4', 1], ['F4', 2], ['R', 2],
        ['E4', 1], ['G#4', 1], ['B4', 1], ['D5', 1], ['F5', 1], ['D5', 1], ['B4', 1], ['G#4', 1],
        ['A4', 3], ['G#4', 1], ['B4', 2], ['R', 2],
        ['E5', 1], ['D5', 1], ['C5', 1], ['A4', 1], ['C5', 1], ['E5', 1], ['A5', 2],
        ['A5', 1], ['F#5', 1], ['E5', 1], ['C5', 1], ['A4', 2], ['R', 2],
        ['D#5', 1], ['F#5', 1], ['A5', 1], ['F#5', 1], ['D#5', 1], ['B4', 1], ['A4', 1], ['F#4', 1],
        ['G#4', 2], ['B4', 2], ['D5', 2], ['R', 2],
        ['A4', 1], ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1], ['C5', 1], ['A4', 1], ['G#4', 1],
        ['G4', 1], ['A#4', 1], ['C5', 1], ['E5', 1], ['G5', 2], ['E5', 1], ['C5', 1],
        ['A5', 1], ['G5', 1], ['D#5', 1], ['C5', 1], ['A4', 1], ['F4', 1], ['D#4', 1], ['C4', 1],
        ['B3', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['G#4', 2], ['B4', 2],
      ],
      comp: (e) => e % 2 === 1 && e !== 5,      // stabs on the off-beats
      drums: 'snare',
      chaos: true,                              // random glitch blips, surprise kicks, fills
    },
  };

  // precompute per track: what starts on each eighth
  for (const name in TRACKS) {
    const tr = TRACKS[name];
    tr.mel = [];
    for (const [n, len] of tr.melody) {
      tr.mel.push(n === 'R' ? null : { m: midi(n), len });
      for (let i = 1; i < len; i++) tr.mel.push(null);
    }
    tr.eighths = tr.mel.length;          // 128 = 16 bars
    tr.beat = 60 / tr.tempo;
    tr.loopLen = tr.bars.length * 4 * tr.beat;
  }

  let ctx = null, out = null, noise = null, timer = null;
  let track = TRACKS.main, wanted = 'main';
  let step = 0, loopStart = 0;

  const eighthTime = (i) => Math.floor(i / 2) * track.beat + (i % 2 ? track.beat * track.swing : 0);

  function bassNote(bar, beat) {
    const [q, root] = track.bars[bar];
    const r = midi(root);
    if (beat === 0) return r;
    if (beat === 1) return r + THIRD[q];
    if (beat === 2) return r + FIFTH[q];
    const next = midi(track.bars[(bar + 1) % track.bars.length][1]);
    return next + (next > r + 7 ? -1 : 1);
  }

  function voice(type, f, t, dur, vol, cutoff) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(vol * 0.5, t + Math.min(dur, 0.35));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (cutoff) {
      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = cutoff;
      node = o.connect(flt);
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

  function kick(t, vol = 0.18) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(100, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.14);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.2);
  }

  function schedule(i, t) {
    const bar = Math.floor(i / 8), e = i % 8, beat = Math.floor(e / 2), off = e % 2 === 1;
    const lastBar = bar === track.bars.length - 1;
    // melody
    const n = track.mel[i];
    if (n) {
      const L = track.lead;
      voice(L.type, hz(n.m), t, (eighthTime(i + n.len) - eighthTime(i)) * 0.92, L.vol, L.cutoff);
    }
    // walking bass on every beat
    if (!off) voice('triangle', hz(bassNote(bar, beat)), t, track.beat * 0.85, 0.32);
    // drums
    if (!off) {
      noiseHit(t, 'highpass', 6500, 0.14, 0.03);                         // ride "ding"
      if (beat === 0 || (track.chaos && beat === 2)) kick(t);
      if (beat === 1 || beat === 3) {
        if (track.drums === 'snare') noiseHit(t, 'bandpass', 1800, 0.1, 0.12);
        else noiseHit(t, 'highpass', 9000, 0.03, 0.035);                  // hi-hat chick
      }
    } else if (beat === 1 || beat === 3) {
      noiseHit(t, 'highpass', 6500, 0.07, 0.02);                          // the swung "ga"
    }
    // comping chords
    if (track.comp(e)) {
      for (const c of track.bars[bar][2]) voice('square', hz(midi(c)), t, track.beat * 0.6, 0.02, 1100);
    }
    // chaos extras
    if (track.chaos) {
      if (Math.random() < 0.1) kick(t, 0.12);                             // surprise kicks
      if (Math.random() < 0.09) {                                         // glitch blips
        const chord = track.bars[bar][2];
        const m = midi(chord[Math.floor(Math.random() * chord.length)]) + 24;
        voice('square', hz(m), t, 0.06, 0.03, 3000);
      }
      if (lastBar && e >= 4) {                                            // fill before the loop repeats
        noiseHit(t, 'bandpass', 1800, 0.06, 0.1);
        noiseHit(t + track.beat * track.swing / 2, 'bandpass', 2200, 0.05, 0.08);
      }
    }
  }

  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (wanted !== null && TRACKS[wanted] !== track) {      // switch track right away
      track = TRACKS[wanted];
      step = 0;
      loopStart = now + 0.08;
    }
    if (loopStart + eighthTime(step) < now) loopStart = now + 0.05 - eighthTime(step);
    while (loopStart + eighthTime(step) < now + 0.25) {
      schedule(step, loopStart + eighthTime(step));
      step++;
      if (step >= track.eighths) { step = 0; loopStart += track.loopLen; }
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
      track = TRACKS[wanted] || TRACKS.main;
      loopStart = 0;
      step = 0;
      timer = setInterval(tick, 25);
    },
    // which track to play: 'main' or 'chaos' (also before the music has started)
    play(name) { if (TRACKS[name]) wanted = name; },
    get track() { return wanted; },
  };
})();
