import { useState, useCallback, type ReactNode } from "react";
import { LayoutContext, type HeaderSlot } from "./layout-context";

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
