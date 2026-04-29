"use client"

import { useMemo, useState } from "react";
import { PAIRS } from "@/lib/constants";
import { fmtDate, fmtRR } from "@/lib/utils";
import { SectionLead, Btn, Chip, EmptyState, Badge, Sel } from "@/components/ui";

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

  const allTags = useMemo(
    () => [...new Map(filtered
      .flatMap(t => t.tags || [])
      .map(tag => [normalizeTag(tag), normalizeTag(tag)])
    ).values()].filter(Boolean).sort(),
    [filtered]
  );

  const displayTrades = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filtered.filter(t => {
      const tagMatch = !filterTag || (t.tags || []).some(tag => normalizeTag(tag) === filterTag);
      if (!tagMatch) return false;
      if (!q) return true;

      const haystack = [
        t.pair,
        t.direction,
        t.session,
        t.result,
        t.dailyBias,
        t.setup,
        t.emotion,
        t.mistakes,
        t.notes,
        ...(t.tags || []).map(normalizeTag),
      ].filter(Boolean).join(" ").toLowerCase();

      return haystack.includes(q);
    });
  }, [filtered, filterTag, query]);

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
        background: `linear-gradient(145deg, ${T.surface}f5, ${T.surface2}f2)`,
        border: `1px solid ${T.border}`,
        borderRadius: 28,
        padding: isMobile ? "16px" : "22px",
        marginBottom: 20,
        boxShadow: `0 24px 68px ${T.cardGlow}`,
        position: "relative",
        overflow: "hidden",
      }}>
        <div aria-hidden="true" style={{ position:"absolute", right:-80, top:-100, width:260, height:260, borderRadius:"50%", background:`radial-gradient(circle,${T.accentBright}1f,transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ position:"relative" }}>
        <SectionLead
          T={T}
          compact={isMobile}
          eyebrow="Execution Archive"
          title="Trade Journal"
          copy="A clean log of what you executed, why it mattered, and what the trade taught you."
          action={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: isMobile ? "stretch" : "flex-end" }}>
              {onRepeatLast && <Btn T={T} ghost onClick={onRepeatLast}>Repeat Last Trade</Btn>}
              <Btn T={T} onClick={onNew}>+ Log Trade</Btn>
            </div>
          }
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(240px, 1.2fr) minmax(220px, 1fr) minmax(220px, 1fr)",
          gap: 10,
        }}>
          <div style={{ background: `${T.surface2}cc`, border: `1px solid ${T.border}`, borderRadius: 18, padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>Search</div>
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search notes, setup, emotion, tags..."
              style={{
                width: "100%",
                background: `${T.surface}cc`,
                border: `1px solid ${T.border}`,
                color: T.text,
                borderRadius: 14,
                padding: "12px 13px",
                outline: "none",
                fontSize: 13,
                fontFamily: "'Satoshi',sans-serif",
              }}
            />
          </div>

          <div style={{ background: `${T.surface2}cc`, border: `1px solid ${T.border}`, borderRadius: 18, padding: 12 }}>
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
                    background: `linear-gradient(145deg, ${T.surface}f8 0%, ${T.surface2}f0 100%)`,
                    border: `1px solid ${resultColor(trade)}55`,
                    borderRadius: 26,
                    padding: isMobile ? "15px" : "20px",
                    boxShadow: `0 22px 58px ${T.cardGlow}`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(circle at 12% 0%, ${resultColor(trade)}18, transparent 34%)`,
                    pointerEvents: "none",
                  }} />

                  <div style={{ position: "relative" }}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
                      gap: 12,
                      alignItems: "start",
                      marginBottom: 12,
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                          <span style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: T.accentBright, letterSpacing: "-0.03em" }}>
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
                              padding: "5px 9px",
                              borderRadius: 999,
                              fontSize: 11,
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
                        <span style={{ fontSize: isMobile ? 24 : 28, fontWeight: 950, color: Number(trade.rr) >= 0 ? T.green : T.red, letterSpacing: "-0.04em" }}>
                          {fmtRR(trade.rr || 0)}
                        </span>
                      </div>
                    </div>

                    {trade.notes && (
                      <div style={{
                        color: T.textDim,
                        lineHeight: 1.7,
                        fontSize: 13,
                        padding: isMobile ? "11px 12px" : "13px 14px",
                        borderRadius: 16,
                        border: `1px solid ${T.border}`,
                        background: `${T.bg}55`,
                        marginBottom: 12,
                      }}>
                        {trade.notes}
                      </div>
                    )}

                    {trade.tags?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {[...new Map(trade.tags.map(tag => [normalizeTag(tag), normalizeTag(tag)])).values()].map(tag => (
                          <span key={tag} title={tag} style={{
                            background: `${T.blue}16`,
                            border: `1px solid ${T.blue}45`,
                            color: T.blue,
                            padding: "4px 10px",
                            fontSize: 11,
                            borderRadius: 999,
                            fontWeight: 800,
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
                        {trade.preScreenshot && <JournalAction T={T} onClick={() => onViewImg(trade.preScreenshot)}>Pre Chart</JournalAction>}
                        {trade.postScreenshot && <JournalAction T={T} onClick={() => onViewImg(trade.postScreenshot)}>Post Chart</JournalAction>}
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

function JournalAction({ T, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${T.accent}18, ${T.blue}12)`,
        border: `1px solid ${T.accent}45`,
        color: T.accentBright,
        padding: "7px 12px",
        borderRadius: 12,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
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
    fontSize: 12,
    fontWeight: 800,
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

export default Journal;
