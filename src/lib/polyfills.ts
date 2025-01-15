// Ensure process is defined before any other imports
if (typeof process === 'undefined') {
  (window as any).process = {
    nextTick: function(fn: Function) {
      return setTimeout(fn, 0);
    },
    env: {}
  };
}

// Export to ensure this file is not tree-shaken
export const ensureProcessExists = () => {
  return typeof process !== 'undefined';
};
