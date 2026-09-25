/**
 * Returns the link only if it is a plain http(s) URL, otherwise undefined.
 *
 * Use it for every href built from user-entered data (proof links, evidence,
 * materials, stage-form fields, synced hackathon links). A `javascript:` or
 * `data:` URL in an href runs script in the viewer's session when clicked —
 * and the viewer is often a faculty member or admin reviewing a submission.
 */
export function safeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
}
