import process from 'process';

// Ensure process is available globally
if (typeof window !== 'undefined') {
  (window as any).process = process;
}

// Export to ensure this file is not tree-shaken
export const ensureProcessExists = () => {
  return typeof process !== 'undefined';
};
