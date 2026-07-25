import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStreak } from "@/components/profile/ProfileStreak";
import { WeeklyActivity } from "@/components/profile/WeeklyActivity";
import { YearlyActivity } from "@/components/profile/YearlyActivity";
import { ProfileAchievements } from "@/components/profile/ProfileAchievements"; // <-- Импортируем
import { CertificatesModal } from "@/components/profile/CertificatesModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, ChevronRight } from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();
  const [isCertificatesOpen, setIsCertificatesOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileHeader user={user} />
          <WeeklyActivity />
          <YearlyActivity />
        </div>

        {/* ПРАВАЯ КОЛОНКА (1/3) */}
        <div className="space-y-6">
          {/* 1. Стрик */}
          <ProfileStreak streakDays={5} />

          {/* 2. Сертификаты */}
          <Card 
            className="border-border bg-card hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => setIsCertificatesOpen(true)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Мои сертификаты</h3>
                  <p className="text-xs text-muted-foreground">Просмотр и скачивание</p>
                </div>
              </div>
              
              <Button variant="ghost" size="icon" className="text-muted-foreground group-hover:text-foreground shrink-0">
                <ChevronRight size={18} />
              </Button>
            </CardContent>
          </Card>

          {/* 3. Достижения (Ачивки) */}
          <ProfileAchievements />
        </div>

      </div>

      <CertificatesModal 
        open={isCertificatesOpen} 
        onOpenChange={setIsCertificatesOpen} 
      />
    </div>
  );
}