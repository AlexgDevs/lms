import { useState } from "react";
import { ArrowRight, Award, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import useAuth from "@/features/auth/api/useAuth";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfileStreak } from "@/features/profile/components/ProfileStreak";
import { WeeklyActivity } from "@/features/profile/components/WeeklyActivity";
import { YearlyActivity } from "@/features/profile/components/YearlyActivity";
import { CertificatesModal } from "@/features/profile/components/CertificatesModal";
import { useProfileStats } from "@/features/profile/api/useProfileStats";
import { useEnrolledCourses } from "@/features/dashboard/api/useCourses";
import { useMyCertificates } from "@/features/certificate/api/useMyCertificates";
import { CourseCard } from "@/features/dashboard/components/CourseCard";
import { PurchasesSection } from "@/features/payment/components/PurchasesSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes";

const MY_COURSES_LIMIT = 3;

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const stats = useProfileStats();
  const enrolled = useEnrolledCourses(true);
  const certificates = useMyCertificates();
  const [isCertificatesOpen, setIsCertificatesOpen] = useState(false);

  const enrolledCourses = enrolled.data ?? [];
  const certificateItems = certificates.data ?? [];
  const courseTitleById: Record<string, string> = {};
  for (const course of enrolledCourses) {
    courseTitleById[course.id] = course.title;
  }

  const goToDashboard = () => navigate({ to: ROUTES.DASHBOARD });

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      <ProfileHeader user={user} />

      {enrolledCourses.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Мои курсы</h2>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {enrolledCourses.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrolledCourses.slice(0, MY_COURSES_LIMIT).map((course) => (
              <CourseCard key={course.id} course={course} alwaysOpenLearn />
            ))}
          </div>

          <button
            type="button"
            onClick={goToDashboard}
            className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            Все курсы <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </section>
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

          <PurchasesSection />
        </div>
      </div>

      <CertificatesModal
        open={isCertificatesOpen}
        onOpenChange={setIsCertificatesOpen}
        certificates={certificateItems}
        courseTitleById={courseTitleById}
      />
    </div>
  );
}