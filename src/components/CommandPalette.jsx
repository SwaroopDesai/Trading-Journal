"use client"

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Overlay } from "@/components/ui";
import { THEME_META } from "@/lib/constants";

export default function CommandPalette({
  T,
  tabs,
  currentTab,
  onTab,
  onNewTrade,
  onNewDaily,
  onNewWeekly,
  onNewMissed,
  onTheme,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = event => {
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isCommandK) return;
      event.preventDefault();
      setOpen(value => !value);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const actions = useMemo(() => {
    const tabActions = tabs.map(tab => ({
      id: `tab-${tab.id}`,
      label: `Go to ${tab.label}`,
      kicker: "Navigation",
      detail: tab.id === currentTab ? "Current tab" : "Open workspace",
      run: () => onTab(tab.id),
    }));

    return [
      { id: "trade", label: "Log trade", kicker: "Action", detail: "Open trade ticket", run: onNewTrade },
      { id: "daily", label: "New daily plan", kicker: "Action", detail: "Prepare today's bias", run: onNewDaily },
      { id: "weekly", label: "New weekly plan", kicker: "Action", detail: "Map the week", run: onNewWeekly },
      { id: "missed", label: "Log missed trade", kicker: "Action", detail: "Record opportunity cost", run: onNewMissed },
      ...tabActions,
      ...THEME_META.map(theme => ({
        id: `theme-${theme.id}`,
        label: `Switch to ${theme.label}`,
        kicker: "Theme",
        detail: "Change visual mode",
        run: () => onTheme(theme.id),
      })),
    ];
  }, [currentTab, onNewDaily, onNewMissed, onNewTrade, onNewWeekly, onTab, onTheme, tabs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions.slice(0, 9);
    return actions
      .filter(action => `${action.label} ${action.kicker} ${action.detail}`.toLowerCase().includes(q))
      .slice(0, 12);
  }, [actions, query]);

  const run = action => {
    action.run?.();
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Command menu (Cmd/Ctrl + K)"
        style={{
          minHeight: 34,
          padding: "7px 10px",
          borderRadius: 10,
          border: `1px solid ${T.border}`,
          background: T.surface2,
          color: T.textDim,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          fontFamily: "var(--font-geist-sans)",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        <span style={{ color: T.text }}>Command</span>
        <span style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          color: T.muted,
          border: `1px solid ${T.border}`,
          borderRadius: 6,
          padding: "1px 5px",
        }}>K</span>
      </button>

      <AnimatePresence>
        {open && (
          <Overlay onClose={() => setOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                width: "min(620px, 94vw)",
                borderRadius: 18,
                border: `1px solid ${T.border}`,
                background: T.surface,
                boxShadow: `0 32px 90px ${T.bg}cc`,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: 14, borderBottom: `1px solid ${T.border}` }}>
                <input
                  autoFocus
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Escape") setOpen(false);
                    if (event.key === "Enter" && visible[0]) run(visible[0]);
                  }}
                  placeholder="Search commands, tabs, themes..."
                  style={{
                    width: "100%",
                    minHeight: 46,
                    border: "none",
                    outline: "none",
                    background: T.surface2,
                    color: T.text,
                    borderRadius: 12,
                    padding: "0 14px",
                    fontFamily: "var(--font-geist-sans)",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                />
              </div>

              <div style={{ padding: 8, maxHeight: "min(460px, 70vh)", overflowY: "auto" }}>
                {visible.length === 0 && (
                  <div style={{ padding: "30px 18px", textAlign: "center", color: T.textDim, fontSize: 13 }}>
                    No command found.
                  </div>
                )}
                {visible.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => run(action)}
                    style={{
                      width: "100%",
                      minHeight: 56,
                      border: `1px solid ${index === 0 ? `${T.accentBright}66` : "transparent"}`,
                      background: index === 0 ? `${T.accent}12` : "transparent",
                      color: T.text,
                      borderRadius: 12,
                      cursor: "pointer",
                      padding: "9px 11px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                      fontFamily: "var(--font-geist-sans)",
                    }}
                  >
                    <span style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      display: "grid",
                      placeItems: "center",
                      background: T.surface2,
                      border: `1px solid ${T.border}`,
                      color: T.accentBright,
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      flexShrink: 0,
                    }}>{action.kicker.slice(0, 2).toUpperCase()}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 900 }}>{action.label}</span>
                      <span style={{ display: "block", marginTop: 3, fontSize: 11, color: T.textDim }}>{action.kicker} - {action.detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </Overlay>
        )}
      </AnimatePresence>
    </>
  );
}
