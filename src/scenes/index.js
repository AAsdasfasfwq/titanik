// Scene list (in order) + music direction. Scene start times come from the voice-over JSON.
import act1 from './act1.js';
import act2 from './act2.js';
import act3 from './act3.js';
import act4 from './act4.js';
import act5 from './act5.js';

export const SCENES = [...act1, ...act2, ...act3, ...act4, ...act5];

// music sections: mood changes at segment ids
export const MUSIC = [
  { seg: 0, mood: 'mystery' }, { seg: 15, mood: 'grand' }, { seg: 28, mood: 'industry' }, { seg: 47, mood: 'wonder' },
  { seg: 72, mood: 'voyage' }, { seg: 102, mood: 'unease' }, { seg: 133, mood: 'tension' }, { seg: 148, mood: 'impact' },
  { seg: 172, mood: 'dread' }, { seg: 212, mood: 'tragic' }, { seg: 249, mood: 'silent' }, { seg: 255, mood: 'sinking' },
  { seg: 273, mood: 'cold' }, { seg: 293, mood: 'hope' }, { seg: 308, mood: 'mourning' }, { seg: 329, mood: 'resolve' },
  { seg: 347, mood: 'abyss' }, { seg: 367, mood: 'legacy' }, { seg: 372, mood: 'warning' },
];
