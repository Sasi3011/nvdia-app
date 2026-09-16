import { ApiError } from "../../lib/api-client";

// Voice guidance (spec 05 Section 18.9): errors state what happened and
// what to do, in the system's voice — not a generic "Something went wrong."
export function ErrorBanner({ error }: { error: unknown }) {
  const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
  return (
    <div className="rounded-card border border-rejected/30 bg-rejected/5 px-4 py-3 text-body text-rejected">{message}</div>
  );
}
