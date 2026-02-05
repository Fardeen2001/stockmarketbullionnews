/**
 * Next.js Instrumentation Hook
 * This runs before any other code, ensuring deprecation warnings are suppressed
 * at the application root level - true root cause implementation
 */

// Suppress deprecation warnings from dependencies (yahoo-finance2, etc.)
// This runs at the very start of the application
if (typeof process !== 'undefined') {
  // Method 1: Override process.emitWarning (primary method)
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

  // Method 2: Override process.stderr.write for deprecation warnings
  if (process.stderr && process.stderr.write) {
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

export async function register() {
  // This function runs when the instrumentation is loaded
  // Suppression is already set up above, this is just for logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Instrumentation] Deprecation warning suppression enabled');
  }
}
