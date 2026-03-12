// Empty module to replace fast-glob on client-side
const emptyGlob = () => Promise.resolve([]);
const emptyGlobSync = () => [];

// Main fast-glob function
const fastGlob = emptyGlob;

// Add sync method
fastGlob.sync = emptyGlobSync;

// Add other common fast-glob methods
fastGlob.glob = emptyGlob;
fastGlob.globSync = emptyGlobSync;
fastGlob.async = emptyGlob;
fastGlob.stream = () => ({ on: () => {}, pipe: () => {} });

// ES modules export
export default fastGlob;
export const sync = emptyGlobSync;
export const glob = emptyGlob;