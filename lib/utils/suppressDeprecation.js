/**
 * Suppress Node.js deprecation warnings from dependencies
 * This is a workaround for yahoo-finance2 and other dependencies
 * that use deprecated url.parse()
 * 
 * This must be imported early, before yahoo-finance2 is used
 * Node-only APIs (process.stderr, process.emitWarning) are skipped in Edge Runtime.
 */

const isEdgeRuntime =
  typeof globalThis.EdgeRuntime === 'string' ||
  (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge');

// Suppress DEP0169 deprecation warning for url.parse() (Node.js only; not supported in Edge)
if (typeof process !== 'undefined' && !isEdgeRuntime) {
  // Method 1: Override process.emitWarning
  if (process.emitWarning) {
    const originalEmitWarning = process.emitWarning;
    process.emitWarning = function(warning, type, code, ...args) {
      // Suppress DEP0169 (url.parse deprecation) warnings
      if (code === 'DEP0169' ||
          (typeof warning === 'string' && warning.includes('url.parse()')) ||
          (typeof warning === 'string' && warning.includes('DEP0169'))) {
        return;
      }
      // Call original emitWarning for other warnings
      return originalEmitWarning.call(this, warning, type, code, ...args);
    };
  }

  // Method 2: Override process.stderr.write (Node-only; not available in Edge Runtime)
  if (process.stderr && typeof process.stderr.write === 'function') {
    const originalStderrWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = function(chunk, encoding, callback) {
      if (typeof chunk === 'string' &&
          (chunk.includes('DEP0169') || chunk.includes('url.parse()'))) {
        return true; // Suppress the warning
      }
      return originalStderrWrite(chunk, encoding, callback);
    };
  }
}

// Method 3: Suppress via console.error override (for some Node versions)
if (typeof console !== 'undefined') {
  if (console.error) {
    const originalError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      // Suppress DEP0169 warnings
      if (message.includes('DEP0169') || 
          message.includes('url.parse()') ||
          message.includes('DeprecationWarning')) {
        return;
      }
      return originalError.apply(console, args);
    };
  }

  if (console.warn) {
    const originalWarn = console.warn;
    console.warn = function(...args) {
      const message = args.join(' ');
      // Suppress DEP0169 warnings
      if (message.includes('DEP0169') || 
          message.includes('url.parse()') ||
          (message.includes('DeprecationWarning') && message.includes('url.parse'))) {
        return;
      }
      return originalWarn.apply(console, args);
    };
  }
}

export default {};
