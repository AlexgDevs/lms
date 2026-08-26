import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Download, Loader2, Calendar } from "lucide-react";
import type { CertificateSchema } from "@/client";
import { useDownloadCertificate } from "@/features/certificate/api/useDownloadCertificate";

interface CertificatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificates?: CertificateSchema[];
  courseTitleById?: Record<string, string>;
}

export function CertificatesModal({
  open,
  onOpenChange,
  certificates = [],
  courseTitleById = {},
}: CertificatesModalProps) {
  const { download, downloadingId } = useDownloadCertificate();

  const shortNumber = (value: string) => `№ ${value.slice(0, 8).toUpperCase()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Award className="text-primary" size={22} />
            Мои сертификаты
          </DialogTitle>
          <DialogDescription>
            Сертификаты выдаются автоматически после успешного завершения курсов.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {certificates.map((cert) => (
                <Card key={cert.id} className="rounded-xl overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h4 className="font-semibold text-base text-foreground line-clamp-2">
                        {courseTitleById[cert.course_id] ?? "Завершённый курс"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          {new Date(cert.issued_at).toLocaleDateString("ru-RU")}
                        </span>
                        <span className="font-mono text-muted-foreground/80 truncate">
                          {shortNumber(cert.certificate_number)}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      disabled={downloadingId === cert.course_id}
                      onClick={() => download(cert.course_id)}
                    >
                      {downloadingId === cert.course_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Скачать
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Состояние, когда сертификатов нет */
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 rounded-xl bg-muted/30">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Award size={24} />
              </div>
              <div className="max-w-xs space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Сертификатов пока нет
                </p>
                <p className="text-xs text-muted-foreground">
                  Завершите ваш первый курс до конца, и он автоматически появится здесь!
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
