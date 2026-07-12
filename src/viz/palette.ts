// Categorical palette — validated with the dataviz skill's validate_palette.js
// (all checks pass light + dark; CVD worst-adjacent ΔE 8.7 = floor band, legal
// because charts also carry legend + direct labels + 2px segment gaps).
// Fixed identity order: blue, orange, purple, green, magenta, cyan. Never cycle.
export const CATEGORICAL_LIGHT = ['#2f7ed8', '#e8700a', '#8a54e0', '#159c5b', '#d13b6e', '#0aa6c2']
export const CATEGORICAL_DARK = ['#2f7ed8', '#d1660a', '#8a54e0', '#159c5b', '#d13b6e', '#0aa6c2']

export function categorical(theme: 'light' | 'dark'): string[] {
  return theme === 'dark' ? CATEGORICAL_DARK : CATEGORICAL_LIGHT
}

// Semantic mapping for the token-composition stack (indices into the fixed order).
export const TOKEN_COLORS = {
  input: CATEGORICAL_LIGHT[0],
  output: CATEGORICAL_LIGHT[1],
  cacheCreation: CATEGORICAL_LIGHT[2],
  cacheRead: CATEGORICAL_LIGHT[5],
}

// Sequential blue ramp for magnitude-encoded viz (e.g. hour heatmap). 5 stops,
// light→dark within each theme so low/high reads consistently regardless of theme.
export const SEQUENTIAL_BLUE_LIGHT = ['#eaf2fb', '#bcd8f2', '#7fb2e5', '#3f83cf', '#1f5fa8']
export const SEQUENTIAL_BLUE_DARK = ['#12233a', '#1c3d63', '#2a5f97', '#3f83cf', '#6aa8e8']
export function sequentialBlue(theme: 'light' | 'dark'): string[] {
  return theme === 'dark' ? SEQUENTIAL_BLUE_DARK : SEQUENTIAL_BLUE_LIGHT
}
