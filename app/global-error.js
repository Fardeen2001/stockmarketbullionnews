'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-primary">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-accent mb-4">500</h1>
            <h2 className="text-2xl font-semibold text-accent/80 mb-4">Application Error</h2>
            <p className="text-accent/70 mb-8">
              A critical error occurred. Please refresh the page or contact support.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
