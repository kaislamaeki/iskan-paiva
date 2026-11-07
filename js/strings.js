// All on-screen text. The pixel font shows everything in CAPITALS
// and supports A–Z, Å Ä Ö, 0–9 and basic punctuation.
const STR = {
  title: 'Iskän päivä',
  subtitle: 'Kotimatka-simulaattori',
  pressStart: 'Paina välilyöntiä aloittaaksesi',
  tapStart: 'Napauta aloittaaksesi',
  rewatchComic: 'Katso intro',
  score: 'Pisteet',
  highScore: 'Ennätys',
  level: 'Taso',
  paused: 'Tauko',
  pausedHintKeys: 'Paina P jatkaaksesi',
  pausedHintTouch: 'Napauta jatkaaksesi',

  // how to play, on the start screen (desktop / phone)
  howTo: 'Näin pelaat',
  controlsDesktop: ['Hyppää: ↑ tai välilyönti', 'Kyykisty: ↓ tai Shift', 'Tauko: P'],
  controlsTouch: ['Hyppää: pyyhkäise ylös', 'Kyykisty: pyyhkäise alas', 'Tauko: ‖-nappi'],
  rotatePhone: 'Käännä puhelin vaakatasoon',

  gameOver: 'GAME OVER',
  tryAgain: 'Yritä uudelleen',
  toTitle: 'Palaa alkuun',
  newRecord: 'Uusi ennätys!',

  victoryTitle: 'Selvisit kotiin!',
  finalScore: 'Pisteet',
  // Placeholder for the personal message (use \n for new lines)
  personalMessage: 'Hyvää isänpäivää iskä!<3\nt. Kaisla',
  playAgain: 'Paina välilyöntiä',
  playAgainTouch: 'Napauta',

  comicSkip: 'Ohita',
  comicNext: 'Jatka',
  gateNext: 'Jatka',        // shown at the gate, waiting for a click
  touchHint: 'Napauta ruudun ylä- tai alaosaa',  // level card, phones only
  comic: [
    { speech: 'Noniin, valmista tuli!' },
    { speech: 'Tärkein ensiksi...', phone: 'Laitappa sauna lämpenemään.' },
    { phoneFrom: 'Touko', phone: 'Ok.' },
    { speech: 'Ei kun menoksi!' },
  ],

  levels: [
    { name: 'Toimisto',       hint: 'Ylös = hyppää   Alas = liu\'u' },
    { name: 'Varjoliito',     hint: 'Ylös = nouse   Alas = sukella' },
    { name: 'Hevonen',      hint: 'Ylös = hyppää   Alas = kumarru' },
    { name: 'Kaislikko',      hint: 'Ylös = loikkaa   Alas = sukella' },
    { name: 'Hiihto',         hint: 'Ylös = hyppää   Alas = kyykisty' },
    { name: 'Anskun työhuone', hint: 'Ylös = hyppää   Alas = liu\'u' },
  ],
  finaleName: 'Sauna',
  toukoFinale: 'Sauna on lämmin!',
  lauriFinale: 'No niin',
};
