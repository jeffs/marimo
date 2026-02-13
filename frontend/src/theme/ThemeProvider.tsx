/* Copyright 2026 Marimo. All rights reserved. */
import { memo, type PropsWithChildren, useLayoutEffect } from "react";
import { useTheme } from "./useTheme";

/**
 * Marimo's theme provider.
 */
export const ThemeProvider: React.FC<PropsWithChildren> = memo(
  ({ children }) => {
    const { theme } = useTheme();
    useLayoutEffect(() => {
      // Take over from the blocking script in index.html that set
      // color-scheme and .dark on <html> to prevent flash-of-light-theme.
      document.documentElement.style.colorScheme = "";
      document.documentElement.style.background = "";
      document.documentElement.classList.remove("dark");
      document.body.classList.add(theme, `${theme}-theme`);
      document.body.dataset.theme = theme;
      return () => {
        document.body.classList.remove(theme, `${theme}-theme`);
        delete document.body.dataset.theme;
      };
    }, [theme]);

    return children;
  },
);
ThemeProvider.displayName = "ThemeProvider";

export const CssVariables: React.FC<{
  variables: Record<`--marimo-${string}`, string>;
  children: React.ReactNode;
}> = ({ variables, children }) => {
  return (
    <div className="contents" style={variables}>
      {children}
    </div>
  );
};
