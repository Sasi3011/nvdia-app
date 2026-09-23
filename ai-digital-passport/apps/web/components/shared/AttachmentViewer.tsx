"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileSpreadsheet, FileText } from "lucide-react";
import { fetchStoredFile, type FileAttachment } from "../../lib/api";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Spinner } from "../ui/Spinner";

const SHEET_MIME = ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"];
const MAX_ROWS = 200;
const MAX_COLS = 26;

function isSheet(a: FileAttachment) {
  return SHEET_MIME.includes(a.mimeType) || /\.(xlsx|xls|csv)$/i.test(a.fileName);
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function SheetTable({ blob }: { blob: Blob }) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await blob.arrayBuffer(), { type: "array" });
        const first = wb.SheetNames[0];
        const sheet = first ? wb.Sheets[first] : undefined;
        if (!sheet) throw new Error("empty");
        const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", blankrows: false });
        if (!cancelled) setRows(data.slice(0, MAX_ROWS).map((r) => r.slice(0, MAX_COLS).map((c) => String(c ?? ""))));
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  if (failed) return <p className="text-xs text-slate-500">This spreadsheet can&apos;t be previewed here. Use Open / Download.</p>;
  if (!rows) return <Spinner label="Reading spreadsheet..." />;
  if (rows.length === 0) return <p className="text-xs text-slate-500">The spreadsheet is empty.</p>;

  return (
    <div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-left text-[11px]">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i === 0 ? "sticky top-0 bg-slate-100 font-bold text-slate-700" : "odd:bg-white even:bg-slate-50/60"}>
              {r.map((c, j) => (
                <td key={j} className="border border-slate-200 px-2 py-1 align-top text-slate-700">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Shows the original uploaded file: PDF and images inline, spreadsheets as a read-only table,
// everything else (Word, PowerPoint ...) as a file card with Open / Download.
export function AttachmentViewer({ attachment }: { attachment: FileAttachment }) {
  const file = useQuery({
    queryKey: ["stored-file", attachment.fileKey],
    queryFn: () => fetchStoredFile(attachment.fileKey),
    staleTime: 5 * 60 * 1000,
  });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file.data) return;
    const objectUrl = URL.createObjectURL(file.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file.data]);

  const isPdf = attachment.mimeType === "application/pdf" || /\.pdf$/i.test(attachment.fileName);
  const isImage = attachment.mimeType.startsWith("image/");
  const sheet = isSheet(attachment);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {sheet ? <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-600" /> : <FileText className="h-5 w-5 shrink-0 text-[#1755A7]" />}
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-slate-900">{attachment.fileName}</div>
            <div className="text-[11px] text-slate-500">{formatSize(attachment.sizeBytes)}</div>
          </div>
        </div>
        {url && (
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
            <a
              href={url}
              download={attachment.fileName}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1755A7] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#134486]"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          </div>
        )}
      </div>

      {file.isLoading && <Spinner label="Loading file..." />}
      {file.isError && <ErrorBanner error={file.error} />}
      {file.data && url && isPdf && <iframe src={url} title={attachment.fileName} className="h-[60vh] w-full rounded-xl border border-slate-200" />}
      {file.data && url && isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={attachment.fileName} className="mx-auto max-h-[60vh] rounded-xl border border-slate-200 object-contain" />
      )}
      {file.data && sheet && <SheetTable blob={file.data} />}
      {file.data && !isPdf && !isImage && !sheet && (
        <p className="text-xs text-slate-500">This file type can&apos;t be shown inside the page. Use Open or Download to view it.</p>
      )}
    </div>
  );
}
