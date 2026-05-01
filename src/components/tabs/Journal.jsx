"use client"

import { useDeferredValue, useMemo, useState } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PAIRS } from "@/lib/constants";
import { fmtDate, fmtRR } from "@/lib/utils";
import { Btn, Chip, EmptyState, Badge, Sel } from "@/components/ui";

function Journal({
  T,
  filtered,
  filterPair,
  setFilterPair,
  filterResult,
  setFilterResult,
  onEdit,
  onDelete,
  onViewImg,
  onNew,
  onRepeatLast,
  viewportWidth,
}) {
  const isMobile = viewportWidth < 768;
  const [filterTag, setFilterTag] = useState(null);
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState([{ id: "date", desc: true }]);
  const deferredQuery = useDeferredValue(query);

  const allTags = useMemo(
    () => [...new Map(filtered
      .flatMap(t => t.tags || [])
      .map(tag => [normalizeTag(tag), normalizeTag(tag)])
    ).values()].filter(Boolean).sort(),
    [filtered]
  );

  const viewFiltered = useMemo(() => {
    const q = String(deferredQuery || "").trim().toLowerCase();
    return filtered.filter(t => {
      const tagMatch = !filterTag || (t.tags || []).some(tag => normalizeTag(tag) === filterTag);
      if (!tagMatch) return false;
      if (!q) return true;
      return getTradeSearchText(t).includes(q);
    });
  }, [deferredQuery, filtered, filterTag]);

  const columns = useMemo(() => [
    { id: "date", accessorKey: "date" },
    { id: "pair", accessorKey: "pair" },
    { id: "result", accessorKey: "result" },
    { id: "rr", accessorFn: row => Number(row.rr) || 0 },
    {
      id: "search",
      accessorFn: getTradeSearchText,
    },
  ], []);

  const table = useReactTable({
    data: viewFiltered,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const displayTrades = table.getRowModel().rows.map(row => row.original);

  const groups = useMemo(() => {
    const byDate = {};
    displayTrades.forEach(t => {
      const key = (t.date || "").slice(0, 10);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(t);
    });

    return Object.entries(byDate).map(([date, trades]) => ({
      date,
      trades,
      dayR: +trades.reduce((sum, t) => sum + (Number(t.rr) || 0), 0).toFixed(2),
    }));
  }, [displayTrades]);

  const resultColor = trade =>
    trade.result === "WIN" ? T.green : trade.result === "LOSS" ? T.red : T.amber;

  const archiveStats = useMemo(() => {
    const wins = displayTrades.filter(t => t.result === "WIN").length;
    const losses = displayTrades.filter(t => t.result === "LOSS").length;
    const totalR = displayTrades.reduce((sum, t) => sum + (Number(t.rr) || 0), 0);
    return { wins, losses, totalR };
  }, [displayTrades]);

  const contextItems = trade => [
    { label: "Bias", value: trade.dailyBias, color: trade.dailyBias === "Bullish" ? T.green : trade.dailyBias === "Bearish" ? T.red : T.textDim },
    { label: "Setup", value: trade.setup },
    { label: "Session", value: trade.session },
    { label: "Emotion", value: trade.emotion },
    { label: "Mistake", value: trade.mistakes !== "None" ? trade.mistakes : null, color: T.red },
  ].filter(item => item.value);

  return (
    <div>
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: isMobile ? "14px" : "16px",
        marginBottom: 16,
      }}>
        <div style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}>
          <div>
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              color: T.muted,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}>Execution Archive</div>
            <div style={{
              fontSize: isMobile ? 20 : 23,
              fontWeight: 900,
              color: T.text,
              letterSpacing: "-0.045em",
              lineHeight: 1,
            }}>Trade Journal</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 9 }}>
              <ArchivePill T={T} label="Trades" value={displayTrades.length} />
              <ArchivePill T={T} label="Net R" value={fmtRR(archiveStats.totalR)} color={archiveStats.totalR >= 0 ? T.green : T.red} />
              <ArchivePill T={T} label="W/L" value={`${archiveStats.wins}/${archiveStats.losses}`} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: isMobile ? "stretch" : "flex-end" }}>
            {onRepeatLast && <Btn T={T} ghost onClick={onRepeatLast}>Repeat Last</Btn>}
            <Btn T={T} onClick={onNew}>+ Log Trade</Btn>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(240px, 1.2fr) minmax(220px, 1fr) minmax(220px, 1fr)",
          gap: 10,
        }}>
          <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>Search</div>
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search notes, setup, emotion, tags..."
              style={{
                width: "100%",
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.text,
                borderRadius: 10,
                minHeight: 44,
                padding: "10px 12px",
                outline: "none",
                fontSize: 13,
                fontFamily: "var(--font-geist-sans)",
                transition: "border .18s ease, box-shadow .18s ease",
              }}
              onFocus={event => { event.currentTarget.style.borderColor = T.accentBright; event.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentBright}1f`; }}
              onBlur={event => { event.currentTarget.style.borderColor = T.border; event.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>Pair</div>
            <Sel T={T} val={filterPair} opts={["ALL", ...PAIRS]} on={setFilterPair} label="Filter by pair" />
          </div>

          <FilterBlock T={T} title="Results">
            {["ALL", "WIN", "LOSS", "BREAKEVEN"].map(result => (
              <Chip key={result} T={T} active={filterResult === result} onClick={() => setFilterResult(result)}>{result}</Chip>
            ))}
          </FilterBlock>
        </div>

        {allTags.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <FilterBlock T={T} title="Tags">
              {allTags.map(tag => (
                <Chip key={tag} T={T} active={filterTag === tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}>{tag}</Chip>
              ))}
            </FilterBlock>
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          <FilterBlock T={T} title="Sort">
            <SortChip T={T} active={sorting[0]?.id === "date" && sorting[0]?.desc} onClick={() => setSorting([{ id: "date", desc: true }])}>Newest</SortChip>
            <SortChip T={T} active={sorting[0]?.id === "date" && !sorting[0]?.desc} onClick={() => setSorting([{ id: "date", desc: false }])}>Oldest</SortChip>
            <SortChip T={T} active={sorting[0]?.id === "rr" && sorting[0]?.desc} onClick={() => setSorting([{ id: "rr", desc: true }])}>Best R</SortChip>
            <SortChip T={T} active={sorting[0]?.id === "rr" && !sorting[0]?.desc} onClick={() => setSorting([{ id: "rr", desc: false }])}>Worst R</SortChip>
            <SortChip T={T} active={sorting[0]?.id === "pair"} onClick={() => setSorting([{ id: "pair", desc: false }])}>Pair A-Z</SortChip>
          </FilterBlock>
        </div>
      </div>

      {displayTrades.length === 0 && (
        <EmptyState
          T={T}
          icon="JR"
          title="No trades match this view"
          copy="Clear a filter or log the next clean execution."
          action={<Btn T={T} onClick={onNew}>+ Log Trade</Btn>}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {groups.map(({ date, trades, dayR }) => (
          <section key={date} className="fade-up">
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: isMobile ? "0 2px 8px" : "0 4px 10px",
              borderBottom: `1px solid ${T.border}`,
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{fmtDate(date)}</span>
              <span style={{ fontSize: 11, color: T.muted }}>{trades.length} trade{trades.length !== 1 ? "s" : ""}</span>
              <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 900, color: dayR >= 0 ? T.green : T.red }}>
                {dayR >= 0 ? "+" : ""}{dayR}R
              </span>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {trades.map(trade => (
                <article
                  key={trade._dbid}
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderTop: `3px solid ${resultColor(trade)}88`,
                    borderRadius: 16,
                    padding: isMobile ? "13px" : "15px 16px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
                      gap: 10,
                      alignItems: "center",
                      marginBottom: 10,
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                          <span style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: T.text, letterSpacing: "-0.035em" }}>
                            {trade.pair}
                          </span>
                          <Badge color={trade.direction === "LONG" ? T.green : T.red}>{trade.direction}</Badge>
                          <span style={{ fontSize: 12, color: T.textDim }}>{fmtDate(trade.date)}</span>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {contextItems(trade).map(item => (
                            <span key={`${trade._dbid}-${item.label}`} style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: `${item.color || T.accent}12`,
                              border: `1px solid ${item.color || T.border}44`,
                              color: item.color || T.textDim,
                              padding: "4px 8px",
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 750,
                              maxWidth: "100%",
                            }}>
                              <span style={{ color: T.muted, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>{item.label}</span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{
                        display: "flex",
                        alignItems: isMobile ? "flex-start" : "flex-end",
                        justifyContent: isMobile ? "space-between" : "flex-start",
                        gap: 8,
                        flexDirection: isMobile ? "row" : "column",
                      }}>
                        <Badge color={resultColor(trade)}>{trade.result}</Badge>
                        <span style={{
                          fontFamily: "'JetBrains Mono','Fira Code',monospace",
                          fontSize: isMobile ? 20 : 24,
                          fontWeight: 800,
                          color: Number(trade.rr) >= 0 ? T.green : T.red,
                          letterSpacing: "-0.04em",
                        }}>
                          {fmtRR(trade.rr || 0)}
                        </span>
                      </div>
                    </div>

                    {trade.notes && (
                      <div style={{
                        color: T.textDim,
                        lineHeight: 1.6,
                        fontSize: 13,
                        padding: isMobile ? "10px 11px" : "11px 12px",
                        borderRadius: 12,
                        border: `1px solid ${T.border}`,
                        background: T.surface2,
                        marginBottom: 10,
                      }}>
                        {trade.notes}
                      </div>
                    )}

                    {trade.tags?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                        {[...new Map(trade.tags.map(tag => [normalizeTag(tag), normalizeTag(tag)])).values()].map(tag => (
                          <span key={tag} title={tag} style={{
                            background: T.surface2,
                            border: `1px solid ${T.border}`,
                            color: T.textDim,
                            padding: "3px 8px",
                            fontSize: 10,
                            borderRadius: 999,
                            fontWeight: 750,
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{
                      display: "flex",
                      alignItems: isMobile ? "stretch" : "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {trade.preScreenshot && <JournalAction T={T} onClick={() => onViewImg(trade.preScreenshot)} label="PRE">Pre Chart</JournalAction>}
                        {trade.postScreenshot && <JournalAction T={T} onClick={() => onViewImg(trade.postScreenshot)} label="POST">Post Chart</JournalAction>}
                      </div>

                      <div style={{ display: "flex", gap: 6, marginLeft: isMobile ? 0 : "auto" }}>
                        <button onClick={() => onEdit(trade)} style={smallButton(T)}>Edit</button>
                        <button onClick={() => onDelete(trade)} style={{ ...smallButton(T), color: T.red }}>Delete</button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilterBlock({ T, title, children }) {
  return (
    <div style={{ background: `${T.surface2}cc`, border: `1px solid ${T.border}`, borderRadius: 18, padding: "12px 12px 10px" }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function ArchivePill({ T, label, value, color }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "baseline",
      gap: 6,
      minHeight: 28,
      padding: "5px 9px",
      borderRadius: 999,
      background: T.surface2,
      border: `1px solid ${T.border}`,
      color: color || T.textDim,
      fontSize: 11,
      fontWeight: 800,
    }}>
      <span style={{ color: T.muted, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>{value}</span>
    </span>
  );
}

function SortChip({ T, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        background: active ? `${T.accent}18` : T.surface,
        border: `1px solid ${active ? T.accentBright : T.border}`,
        color: active ? T.accentBright : T.textDim,
        padding: "7px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 850,
        cursor: "pointer",
        minHeight: 34,
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      {children}
    </button>
  );
}

function JournalAction({ T, onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={children}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        minHeight: 40,
        background: T.surface2,
        border: `1px solid ${T.accent}45`,
        color: T.accentBright,
        padding: "7px 11px",
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "var(--font-geist-sans)",
        fontSize: 11,
        fontWeight: 800,
        transition: "border .18s ease, background .18s ease, color .18s ease",
      }}
      onMouseEnter={event => { event.currentTarget.style.borderColor = T.accentBright; event.currentTarget.style.background = `${T.accent}12`; }}
      onMouseLeave={event => { event.currentTarget.style.borderColor = `${T.accent}45`; event.currentTarget.style.background = T.surface2; }}
    >
      <span style={{
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 9,
        color: T.textDim,
        letterSpacing: "0.08em",
      }}>{label}</span>
      {children}
    </button>
  );
}

function smallButton(T) {
  return {
    background: "transparent",
    border: `1px solid ${T.border}`,
    color: T.textDim,
    padding: "7px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "var(--font-geist-sans)",
    fontSize: 12,
    fontWeight: 800,
    minHeight: 40,
  };
}

function normalizeTag(tag) {
  const clean = String(tag || "").trim();
  const lower = clean.toLowerCase();
  if (!clean) return "";
  if (lower.includes("htf") && (lower.includes("align") || lower.includes("bias") || lower.includes("profile"))) return "HTF aligned";
  if (lower.includes("a+") || lower.includes("a plus")) return "A+ setup";
  return clean;
}

function getTradeSearchText(trade) {
  return [
    trade.pair,
    trade.direction,
    trade.session,
    trade.result,
    trade.dailyBias,
    trade.setup,
    trade.emotion,
    trade.mistakes,
    trade.notes,
    ...(trade.tags || []).map(normalizeTag),
  ].filter(Boolean).join(" ").toLowerCase();
}

export default Journal;
