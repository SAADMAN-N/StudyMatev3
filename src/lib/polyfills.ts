export const nextTick = (fn: Function) => {
  setTimeout(fn, 0);
};

if (typeof process === 'undefined') {
  (window as any).process = {
    nextTick: nextTick,
    env: {}
  };
}
