import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogIn } from "lucide-react";
import useAuth from "@/features/auth/api/useAuth";

export function UserMenu() {
  const { user, isLoggedIn, logout } = useAuth();

  // Если не авторизован — рендерим кнопку входа
  if (!isLoggedIn) {
    return (
      <Button asChild variant="default" size="sm" className="rounded-full gap-2 cursor-pointer ml-1">
        <Link to="/login">
          <LogIn size={16} />
          <span>Войти</span>
        </Link>
      </Button>
    );
  }

  // Если авторизован — рендерим аватар с меню
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none ml-1 cursor-pointer rounded-full focus:ring-2 focus:ring-primary/40">
          <Avatar>
            <AvatarImage
              src={user?.avatar_url ?? undefined}
              alt={user?.username || "Аватар"}
            />
            <AvatarFallback>
              {user?.username?.[0]?.toUpperCase() || <User size={16} />}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground">{user?.username}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            Профиль
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}