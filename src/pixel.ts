// Bounded presentation experiment. No gameplay state or geometry belongs here.
// Unlisted colours retain the authored M4 treatment.
const palette: Record<string, string> = {
  '#934c3e': '#8d483c', '#d4c6a4': '#c8bb94',
  '#405957': '#304f50', '#708682': '#78958a',
  '#847d6b': '#686c5b', '#e1d4b5': '#ead5a3',
  '#556b43': '#3f5946', '#71804b': '#748252',
  '#576e44': '#3f5946', '#6c814d': '#748252',
  '#5b7046': '#3f5946', '#7c8c50': '#89955d',
  '#648f8c': '#477d7b', '#a3bbb0': '#92b3a0',
  '#9b784e': '#a58154', '#d8b66b': '#efc36d',
  '#594e48': '#674c4b', '#3e4c49': '#303f43',
  '#497e63': '#287968', '#e0d5ac': '#fff0b7',
  '#e5ca84': '#f7d878',
};
export const pixelColor = (color: string) => palette[color] ?? color;
