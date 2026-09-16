"use client";

import { API_BASE_URL, claimsApi } from "../../lib/api";

// SEC-07: downloads are authorized through the app via a short-lived
// presigned URL — never a stored public link. Shared by the student claim
// detail page and the mentor review detail page.
export function DownloadLink({
  claimId,
  attachmentId,
  fileName,
  className = "text-navy-700 underline underline-offset-2",
}: {
  claimId: string;
  attachmentId: string;
  fileName: string;
  className?: string;
}) {
  return (
    <button
      className={className}
      onClick={async () => {
        const { downloadUrl } = await claimsApi.downloadUrl(claimId, attachmentId);
        window.open(downloadUrl.startsWith("/") ? `${API_BASE_URL}${downloadUrl}` : downloadUrl, "_blank", "noopener,noreferrer");
      }}
    >
      {fileName}
    </button>
  );
}
