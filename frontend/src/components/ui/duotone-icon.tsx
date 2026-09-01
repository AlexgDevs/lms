import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type DuotoneTone = "accent" | "reward";

interface DuotoneIconProps {
    icon: LucideIcon;
    className?: string;
    tone?: DuotoneTone;
    size?: number;
    strokeWidth?: number;
}

export function DuotoneIcon({
    icon: Icon,
    className,
    tone = "accent",
    size = 18,
    strokeWidth = 1.75,
}: DuotoneIconProps) {
    const isReward = tone === "reward";

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-md bg-primary/10 p-1.5 transition-colors",
                isReward && "bg-reward/10",
                className
            )}
        >
            <Icon
                size={size}
                strokeWidth={strokeWidth}
                className={cn(
                    "text-muted-foreground",
                    isReward ? "fill-reward/25" : "fill-primary/25"
                )}
            />
        </span>
    );
}
