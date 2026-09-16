import Link from "next/link";

// Page 3 — Access Denied (spec 02 Section 6.1). Public. Shown when a
// non-institutional email attempts login (BR-01/FR-AUTH-01).
export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-muted px-4 text-center">
      <h1 className="text-h1 text-rejected">Access denied</h1>
      <p className="max-w-sm text-body text-text-muted">
        Only {process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ? `@${process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN}` : "institutional"}{" "}
        accounts may sign in to the AI Digital Passport. If you believe this is a mistake, sign in with your institutional Google
        account instead.
      </p>
      <Link href="/login" className="text-body text-navy-700 underline underline-offset-2">
        Back to sign in
      </Link>
    </div>
  );
}
