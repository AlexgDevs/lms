import { createContext, type ReactNode } from "react";

export interface HeaderSlot {
    /** Кастомный контент для шапки (например, поиск, хлебные крошки или навигация) */
    content: ReactNode | null;
    /** Видимость шапки на текущей странице */
    visible: boolean;
}

export interface LayoutContextValue {
    header: HeaderSlot;

    setHeader: (content: ReactNode | null) => void;
    toggleHeader: () => void;
    showHeader: () => void;
    hideHeader: () => void;
}

export const LayoutContext = createContext<LayoutContextValue | null>(null);
