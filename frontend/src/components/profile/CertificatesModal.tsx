import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Download, ExternalLink, Calendar } from "lucide-react";

export interface Certificate {
  id: string | number;
  title: string;
  issuedAt: string;
  code: string;
}

interface CertificatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificates?: Certificate[];
}

// Заглушка, если пока нет реальных данных
const DEFAULT_CERTIFICATES: Certificate[] = [
  // { id: 1, title: "Основы веб-разработки на Python", issuedAt: "12.05.2026", code: "CERT-9821" },
];

export function CertificatesModal({
  open,
  onOpenChange,
  certificates = DEFAULT_CERTIFICATES,
}: CertificatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex flex-col justify-between p-4 rounded-xl border border-border bg-background/60 hover:border-primary/50 transition-colors group space-y-3"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground line-clamp-2">
                      {cert.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Calendar size={12} />
                      <span>Выдан: {cert.issuedAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    <span className="font-mono text-muted-foreground/80">{cert.code}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" title="Открыть">
                        <ExternalLink size={14} />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Скачать PDF">
                        <Download size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Состояние, когда сертификатов нет */
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 rounded-xl border border-dashed border-border bg-muted/20">
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