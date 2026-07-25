import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { BookOpen } from "lucide-react";
import useAuth from "@/hooks/useAuth";

export function RootPage() {
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <div className="flex w-full flex-col items-center justify-center gap-8 py-16">
      {/* Секция-заглушка */}
      <div className="flex flex-col items-center text-center max-w-md space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <BookOpen size={24} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Скоро здесь появятся курсы
        </h1>
        <p className="text-sm text-muted-foreground">
          Мы активно готовим учебные материалы и платформу к запуску.
        </p>
      </div>

      {/* Инфо профиля — видна только когда юзер залогинен */}
      {isLoggedIn && (
        <Card className="w-full max-w-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">User Info</CardTitle>
          </CardHeader>
          <FieldSeparator className="*:h-px" />
          <CardContent className="flex flex-col gap-3 pt-4">
            <Field className="flex flex-row justify-between items-center text-sm">
              <FieldLabel className="text-muted-foreground">Username:</FieldLabel>
              <span className="font-medium text-foreground">{user?.username}</span>
            </Field>

            <Field className="flex flex-row justify-between items-center text-sm">
              <FieldLabel className="text-muted-foreground">Email:</FieldLabel>
              <span className="font-medium text-foreground truncate max-w-[180px]">
                {user?.email}
              </span>
            </Field>

            <Field className="flex flex-row justify-between items-center text-sm">
              <FieldLabel className="text-muted-foreground">Registered:</FieldLabel>
              <span className="font-medium text-foreground">
                {user?.joined_at ? dayjs(user.joined_at).format("DD.MM.YYYY") : "—"}
              </span>
            </Field>

            <FieldSeparator className="*:h-px my-1" />

            <Field>
              <Button
                variant="destructive"
                size="sm"
                className="w-full cursor-pointer"
                onClick={logout}
              >
                Logout
              </Button>
            </Field>
          </CardContent>
        </Card>
      )}
    </div>
  );
}