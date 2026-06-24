"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          color: "#f4f4f5",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "2.5rem",
            maxWidth: "28rem",
          }}
        >
          <h1
            style={{
              margin: "0 0 0.75rem",
              fontSize: "1.125rem",
              fontWeight: 500,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: "0 0 1.5rem",
              fontSize: "0.875rem",
              color: "#a1a1aa",
            }}
          >
            A critical error occurred. Please reload the page.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#0a0a0a",
              backgroundColor: "#06b6d4",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}