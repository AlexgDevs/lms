import dayjs from "dayjs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Calendar, ShieldCheck } from "lucide-react";

interface ProfileHeaderProps {
  user?: {
    username?: string;
    email?: string;
    avatar_url?: string;
    joined_at?: string;
  };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
        {/* Аватар пользователя */}
        <Avatar className="w-24 h-24 border-4 border-primary/20 text-xl shadow-md shrink-0">
          <AvatarImage src={user?.avatar_url} alt={user?.username || "Аватар"} />
          <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
            {user?.username?.[0]?.toUpperCase() || <UserIcon size={32} />}
          </AvatarFallback>
        </Avatar>

        {/* Информация о пользователе */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {user?.username || "Пользователь"}
            </h1>
            
            {/* Заглушка роли */}
            <Badge variant="secondary" className="w-fit mx-auto md:mx-0 gap-1">
              <ShieldCheck size={13} className="text-primary" />
              <span>Студент</span>
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground truncate">
            {user?.email || "email@example.com"}
          </p>

          <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-muted-foreground pt-1">
            <Calendar size={14} />
            <span>
              На платформе с{" "}
              {user?.joined_at
                ? dayjs(user.joined_at).format("DD MMMM YYYY")
                : "недавно"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}