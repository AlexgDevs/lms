import { useState } from "react";
import { Award, BookOpen, ChevronRight } from "lucide-react";
import useAuth from "@/features/auth/api/useAuth";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfileStreak } from "@/features/profile/components/ProfileStreak";
import { WeeklyActivity } from "@/features/profile/components/WeeklyActivity";
import { YearlyActivity } from "@/features/profile/components/YearlyActivity";
import { ProfileAchievements } from "@/features/profile/components/ProfileAchievements";
import { CertificatesModal } from "@/features/profile/components/CertificatesModal";
import { useProfileStats } from "@/features/profile/api/useProfileStats";
import { useEnrolledCourses } from "@/features/dashboard/api/useCourses";
import { CourseRowSection } from "@/features/dashboard/components/CourseRowSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProfilePage() {
  const { user } = useAuth();
  const stats = useProfileStats();
  const enrolled = useEnrolledCourses(true);
  const [isCertificatesOpen, setIsCertificatesOpen] = useState(false);

  const enrolledCourses = enrolled.data ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      <ProfileHeader user={user} />

      {enrolledCourses.length > 0 && (
        <CourseRowSection
          title="Мои курсы"
          icon={BookOpen}
          count={enrolledCourses.length}
          courses={enrolledCourses}
          alwaysOpenLearn
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <WeeklyActivity activity={stats.data?.weekly} />
          <YearlyActivity data={stats.data?.yearly} isLoading={stats.isLoading} />
        </div>

        <div className="space-y-6">
          <ProfileStreak streakDays={stats.data?.streak.current} />

          <Card
            className="bg-card hover:shadow-glow-primary transition-all cursor-pointer group"
            onClick={() => setIsCertificatesOpen(true)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
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