import {
  createContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface HeaderSlot {
  /** Кастомный контент для шапки (например, поиск, хлебные крошки или навигация) */
  content: ReactNode | null;
  /** Видимость шапки на текущей странице */
  visible: boolean;
}

interface LayoutContextValue {
  header: HeaderSlot;

  setHeader: (content: ReactNode | null) => void;
  toggleHeader: () => void;
  showHeader: () => void;
  hideHeader: () => void;
}

export const LayoutContext = createContext<LayoutContextValue | null>(null);

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [header, setHeaderState] = useState<HeaderSlot>({
    content: null,
    visible: true,
  });

  const setHeader = useCallback((content: ReactNode | null) => {
    setHeaderState((prev) => ({
      ...prev,
      content,
      visible: content !== null,
    }));
  }, []);

  const toggleHeader = useCallback(() => {
    setHeaderState((prev) => ({ ...prev, visible: !prev.visible }));
  }, []);

  const showHeader = useCallback(() => {
    setHeaderState((prev) => ({ ...prev, visible: true }));
  }, []);

  const hideHeader = useCallback(() => {
    setHeaderState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        header,
        setHeader,
        toggleHeader,
        showHeader,
        hideHeader,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}