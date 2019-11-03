import { Scale, ScaleName, ScaleNameTokens } from 'ann-music-scale';
import { Chord, CHORD } from 'ann-music-chord';
import { chromaToIntervals, EmptySet, PcsetProps, modes as chromaModes } from 'ann-music-pc';
import { IntervalName } from 'ann-music-interval';
import { Note, NoteName, NoteMidi } from 'ann-music-note';

export type ModeNumber = number;
export type ModeName = string;
export type ModePcSet = number;
export type ModeFifths = number;
export type ModeTriad = string;
export type ModeSeventh = string;
export type ModeAlias = string;
export interface Mode extends PcsetProps {
  readonly intervals: IntervalName[];
  readonly modeNum: number;
  readonly name: string;
  readonly alt: number; // number of alterations === number of fiths
  readonly triad: string;
  readonly seventh: string;
  readonly aliases: string[];
}

export type ModeDefinition = [ModeNumber, ModePcSet, ModeFifths, ModeName, ModeTriad, ModeSeventh, ModeAlias?];

const DATA: ModeDefinition[] = [
  [0, 2773, 0, 'ionian', '', 'Maj7', 'major'],
  [1, 2902, 2, 'dorian', 'm', 'm7'],
  [2, 3418, 4, 'phrygian', 'm', 'm7'],
  [3, 2741, -1, 'lydian', '', 'Maj7'],
  [4, 2774, 1, 'mixolydian', '', '7'],
  [5, 2906, 3, 'aeolian', 'm', 'm7', 'minor'],
  [6, 3434, 5, 'locrian', 'dim', 'm7b5'],
];

const NoMode: Mode = {
  ...EmptySet,
  aliases: [],
  alt: 0,
  intervals: [],
  modeNum: NaN,
  name: '',
  seventh: '',
  triad: '',
};

const all: Mode[] = DATA.map(toMode);
const index: Record<string, Mode> = {};
all.forEach(scaleMode => {
  index[scaleMode.name] = scaleMode;
  scaleMode.aliases.forEach(alias => {
    index[alias] = scaleMode;
  });
});

interface Named {
  readonly name: string;
}
type ModeLiteral = string | Named;

/**
 * Get a Mode by it's name
 *
 * @example
 * mode('dorian')
 * // =>
 * // {
 * //   intervals: [ '1P', '2M', '3m', '4P', '5P', '6M', '7m' ],
 * //   modeNum: 1,
 * //   chroma: '101101010110',
 * //   normalized: '101101010110',
 * //   name: 'dorian',
 * //   setNum: 2902,
 * //   alt: 2,
 * //   triad: 'm',
 * //   seventh: 'm7',
 * //   aliases: []
 * // }
 */
export function mode(name: ModeLiteral): Mode {
  return typeof name === 'string' ? index[name.toLowerCase()] || NoMode : name && name.name ? mode(name.name) : NoMode;
}

/**
 * Get a list of all know modes
 */
export function entries() {
  return all.slice();
}

function toMode(scaleMode: ModeDefinition): Mode {
  // type ModeDefinition = [ModePcSet, ModeFifths, ModeName, ModeTriad, ModeSeventh, ModeAlias?];
  // [2906, 3, 'aeolian', 'm', 'm7', 'minor'],

  const [modeNum, num, alt, name, triad, seventh, alias] = scaleMode;
  const aliases = alias ? [alias] : [];
  const chroma = Number(num).toString(2);
  const intervals = chromaToIntervals(chroma);
  return {
    aliases,
    alt,
    chroma,
    empty: false,
    intervals,
    modeNum: +modeNum,
    name,
    normalized: chroma,
    num,
    seventh,
    triad,
  };
}

namespace Theory {
  export const MODES = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];

  export const IONIAN_CHORDS = 'M m m M M m o'.split(' ');
  export const IONIAN_STEPS = 'W W H W W W H'.split(' ');

  export const MODES_CHORDS = {
    dorian: ['m', 'm', 'M', 'M', 'm', 'o', 'M'],
    ionian: ['M', 'm', 'm', 'M', 'M', 'm', 'o'],
    phrygian: ['m', 'M', 'M', 'm', 'o', 'M', 'm'],
    lydian: ['M', 'M', 'm', 'o', 'M', 'm', 'm'],
    aeolian: ['m', 'o', 'M', 'm', 'm', 'M', 'M'],
    mixolydian: ['M', 'm', 'o', 'M', 'm', 'm', 'M'],
    locrian: ['o', 'M', 'm', 'm', 'M', 'M', 'm'],
  };

  export const MODES_STEPS = {
    aeolian: ['W', 'H', 'W', 'W', 'H', 'W', 'W'],
    dorian: ['W', 'H', 'W', 'W', 'W', 'H', 'W'],
    ionian: ['W', 'W', 'H', 'W', 'W', 'W', 'H'],
    locrian: ['H', 'W', 'W', 'H', 'W', 'W', 'W'],
    lydian: ['W', 'W', 'W', 'H', 'W', 'W', 'H'],
    mixolydian: ['W', 'W', 'H', 'W', 'W', 'H', 'W'],
    phrygian: ['H', 'W', 'W', 'W', 'H', 'W', 'W'],
  };
}

const midiToNote = (midi: NoteMidi) => Note(midi).name;

const transposeFormula = (formula: number[], octave: number) => formula.map(t => t + 12 * octave);

export function chordNotes(root: NoteName, chord: string, octaves: number = 1) {
  // Note object for @root
  const note = Note(root);

  // Create chord formula for @root@type
  const formula = CHORD.chordFormula(chord);

  // Create array of octaves to map formula onto
  const octs = Array(octaves)
    .fill(0)
    .map((n, i) => i);

  // Array of chord formula extended by num of @octaves
  const transposed = octs.reduce((acc, curr) => (acc = acc.concat(transposeFormula(formula, curr))), []);

  // Convert @transposed array (Note.midi) to note name
  return transposed.map(i => note.midi + i).map(midiToNote);
}

export function modeToChords(name: string, root: NoteName) {
  const scaleMode = Scale([root, name]).notes;
  const modes = Theory.MODES_CHORDS[name];
  return modes.map((ch, i) => Chord([scaleMode[i], ch]).notes);
}

export function scaleModes(src: ScaleName | ScaleNameTokens) {
  const scale = Scale(src) as Scale;
  const chroma = scale['chroma'];
  return chromaModes(chroma).map(modes => Scale(modes));
}
