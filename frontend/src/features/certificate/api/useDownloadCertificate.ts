import { useState } from "react";
import { client } from "@/client/client.gen";
import { getErrorMessage } from "@/lib/errors";
import { showErrorToast, withLoadingToast } from "@/lib/toast";

async function triggerDownload(pdfBlob: Blob, filename: string) {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const useDownloadCertificate = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const download = async (courseId: string, filename?: string) => {
    setDownloadingId(courseId);
    try {
      const { data, response } = await withLoadingToast(
        client.get({
          url: `/api/v1/courses/${courseId}/certificate`,
          parseAs: "blob",
          throwOnError: true,
        }),
        {
          loading: "Готовим сертификат...",
          success: "Сертификат скачан",
          error: "Не удалось загрузить сертификат",
        }
      );

      const blob = data as Blob;
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const fallback = filename ?? `certificate-${courseId}.pdf`;
      const match = disposition.match(/filename="?([^";]+)"?/);
      await triggerDownload(blob, match?.[1] ?? fallback);
    } catch (err) {
      showErrorToast(getErrorMessage(err) || "Не удалось загрузить сертификат");
    } finally {
      setDownloadingId(null);
    }
  };

  return { download, downloadingId };
};
