/**
 * Node.js-only deprecation suppression (process.emitWarning / stderr).
 * Loaded only from instrumentation.js register() when not Edge — keeps the
 * root instrumentation module free of Node APIs Turbopack rejects for Edge.
 */

if (process.emitWarning) {
  const originalEmitWarning = process.emitWarning;
  process.emitWarning = function (warning, type, code, ...args) {
    if (
      code === 'DEP0169' ||
      (typeof warning === 'string' && warning.includes('url.parse()')) ||
      (typeof warning === 'string' && warning.includes('DEP0169'))
    ) {
      return;
    }
    return originalEmitWarning.call(this, warning, type, code, ...args);
  };
}

const stderr = globalThis.process?.stderr;
if (stderr && typeof stderr.write === 'function') {
  const originalStderrWrite = stderr.write.bind(stderr);
  stderr.write = function (chunk, encoding, callback) {
    if (
      typeof chunk === 'string' &&
      (chunk.includes('DEP0169') || chunk.includes('url.parse()'))
    ) {
      return true;
    }
    return originalStderrWrite(chunk, encoding, callback);
  };
}
