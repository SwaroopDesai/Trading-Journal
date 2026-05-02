"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Pencil, Search, X } from "lucide-react";
import { PAIRS } from "@/lib/constants";
import { fmtDate, fmtRR, normalizeImageList } from "@/lib/utils";
import { Btn, EmptyState } from "@/components/ui";

const PAIR_ORDER = ["ALL", "NAS100", "SPX500", "EURUSD", "GBPUSD", "GER30", "USDCAD"];
const RESULT_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "WIN", label: "Wins" },
  { value: "LOSS", label: "Losses" },
  { value: "BREAKEVEN", label: "B/E" },
];

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
  const isBrutal = !!T.hardShadow;
  const [filterTag, setFilterTag] = useState(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const closeExpanded = event => {
      if (event.key === "Escape") setExpandedId(null);
    };
    window.addEventListener("keydown", closeExpanded);
    return () => window.removeEventListener("keydown", closeExpanded);
  }, []);

  const allTags = useMemo(
    () => [...new Map(filtered
      .flatMap(trade => trade.tags || [])
      .map(tag => [normalizeTag(tag), normalizeTag(tag)])
    ).values()].filter(Boolean).sort(),
    [filtered]
  );

  const tableData = useMemo(() => {
    const q = String(deferredQuery || "").trim().toLowerCase();
    const base = filtered.filter(trade => {
      const tagMatch = !filterTag || (trade.tags || []).some(tag => normalizeTag(tag) === filterTag);
      if (!tagMatch) return false;
      if (!q) return true;
      return getTradeSearchText(trade).includes(q);
    });

    return [...base].sort((a, b) => {
      const dateDiff = new Date(b.date || 0) - new Date(a.date || 0);
      if (dateDiff) return dateDiff;
      return new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0);
    });
  }, [deferredQuery, filtered, filterTag]);

  const sorting = useMemo(
    () => sortKey && sortDir ? [{ id: sortKey, desc: sortDir === "desc" }] : [],
    [sortKey, sortDir]
  );

  const columns = useMemo(() => {
    const base = [
      {
        id: "date",
        accessorKey: "date",
        header: "Date",
        size: 90,
        enableSorting: true,
        cell: ({ row }) => <DateCell date={row.original.date} />,
      },
      {
        id: "pair",
        accessorKey: "pair",
        header: "Pair",
        enableSorting: true,
        cell: ({ row }) => <PairCell trade={row.original} />,
      },
      {
        id: "direction",
        accessorKey: "direction",
        header: "Direction",
        cell: ({ row }) => <DirectionBadge direction={row.original.direction} />,
      },
      {
        id: "result",
        accessorKey: "result",
        header: "Result",
        cell: ({ row }) => <ResultPill result={row.original.result} />,
      },
      {
        id: "rr",
        accessorFn: row => Number(row.rr) || 0,
        header: "R",
        enableSorting: true,
        meta: { align: "right" },
        cell: ({ row }) => <RRCell T={T} value={row.original.rr} />,
      },
      {
        id: "session",
        accessorKey: "session",
        header: "Session",
        meta: { hideMobile: true },
        cell: ({ row }) => <MetaCell value={row.original.session} />,
      },
      {
        id: "setup",
        accessorKey: "setup",
        header: "Setup",
        meta: { hideMobile: true },
        cell: ({ row }) => <SetupCell value={row.original.setup} />,
      },
      {
        id: "bias",
        accessorKey: "dailyBias",
        header: "Bias",
        meta: { hideMobile: true },
        cell: ({ row }) => <BiasCell bias={row.original.dailyBias} />,
      },
      {
        id: "emotion",
        accessorKey: "emotion",
        header: "Emotion",
        meta: { hideMobile: true },
        cell: ({ row }) => <EmotionCell emotion={row.original.emotion} />,
      },
      {
        id: "actions",
        header: "Actions",
        meta: { align: "right" },
        enableSorting: false,
        cell: ({ row }) => (
          <ActionButtons
            expanded={expandedId === row.original._dbid}
            onExpand={event => {
              event.stopPropagation();
              toggleExpanded(row.original._dbid);
            }}
            onEdit={event => {
              event.stopPropagation();
              onEdit(row.original);
            }}
            onDelete={event => {
              event.stopPropagation();
              onDelete(row.original);
            }}
          />
        ),
      },
    ];

    return isMobile ? base.filter(column => !column.meta?.hideMobile) : base;
  }, [T, expandedId, isMobile, onDelete, onEdit]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const displayTrades = rows.map(row => row.original);

  const stats = useMemo(() => {
    const wins = displayTrades.filter(trade => trade.result === "WIN");
    const losses = displayTrades.filter(trade => trade.result === "LOSS");
    const totalR = displayTrades.reduce((sum, trade) => sum + (Number(trade.rr) || 0), 0);
    const avgWin = wins.length ? wins.reduce((sum, trade) => sum + (Number(trade.rr) || 0), 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((sum, trade) => sum + (Number(trade.rr) || 0), 0) / losses.length : 0;
    const winRate = displayTrades.length ? wins.length / displayTrades.length * 100 : 0;
    return {
      total: displayTrades.length,
      totalR,
      wins: wins.length,
      losses: losses.length,
      winRate,
      avgWin,
      avgLoss,
    };
  }, [displayTrades]);

  function toggleExpanded(id) {
    setExpandedId(current => current === id ? null : id);
  }

  function cycleSort(columnId) {
    if (sortKey !== columnId) {
      setSortKey(columnId);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }
    setSortKey(null);
    setSortDir(null);
  }

  function sortGlyph(columnId) {
    if (sortKey !== columnId) return "\u2195";
    return sortDir === "asc" ? "\u2191" : "\u2193";
  }

  function activeCount(value, type) {
    if (type === "pair" && filterPair === value && value !== "ALL") return displayTrades.length;
    if (type === "result" && filterResult === value && value !== "ALL") return displayTrades.length;
    if (type === "tag" && filterTag === value) return displayTrades.length;
    return null;
  }

  return (
    <div
      className={`journal-power-table ${isBrutal ? "journal-brutal" : ""}`}
      style={journalVars(T)}
    >
      <style>{journalCSS(T)}</style>

      <section className="journal-command-deck" aria-label="Journal overview">
        <header className="journal-page-header">
          <div>
            <span className="journal-eyebrow">Execution Archive</span>
            <h1>Trade <span>Journal</span></h1>
            <p>
              {stats.total} trades / {fmtRR(stats.totalR)} net / {stats.wins}W / {stats.losses}L
            </p>
          </div>
          <div className="journal-actions">
            {onRepeatLast && (
              <button type="button" className="journal-action secondary" onClick={onRepeatLast}>
                Repeat Last
              </button>
            )}
            <button type="button" className="journal-action primary" onClick={onNew}>
              + Log Trade
            </button>
          </div>
        </header>

        <div className="journal-stat-strip" aria-label="Journal stats">
          <StatCell label="Total Trades" value={stats.total} />
          <StatCell label="Net R" value={fmtRR(stats.totalR)} sub={`${stats.wins} wins / ${stats.losses} losses`} tone={stats.totalR >= 0 ? "green" : "red"} gradient={stats.totalR > 0} />
          <StatCell label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} tone={stats.winRate >= 50 ? "green" : "red"} />
          <StatCell label="Avg Win" value={fmtRR(stats.avgWin)} sub="winning trades" tone="green" />
          <StatCell label="Avg Loss" value={fmtRR(stats.avgLoss)} sub="losing trades" tone="red" />
        </div>
      </section>

      <section className="journal-filter-bar" aria-label="Journal filters">
        <div className="journal-filter-main">
          <div className="journal-search">
            <Search size={14} aria-hidden="true" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search notes, setup, emotion, tags..."
              aria-label="Search trades"
            />
          </div>

          <div className="journal-filter-cluster" aria-label="Pair filter">
            <span className="journal-filter-label">Pair</span>
            <div className="journal-chip-group">
              {PAIR_ORDER.filter(pair => pair === "ALL" || PAIRS.includes(pair)).map(pair => (
                <FilterChip
                  key={pair}
                  active={filterPair === pair}
                  onClick={() => setFilterPair(pair)}
                  count={activeCount(pair, "pair")}
                >
                  {pairLabel(pair)}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="journal-filter-cluster compact" aria-label="Result filter">
            <span className="journal-filter-label">Result</span>
            <div className="journal-chip-group">
              {RESULT_FILTERS.map(result => (
                <FilterChip
                  key={result.value}
                  active={filterResult === result.value}
                  onClick={() => setFilterResult(result.value)}
                  count={activeCount(result.value, "result")}
                >
                  {result.label}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="journal-tags-filter" aria-label="Tag filter">
            <span className="journal-filter-label">Tags</span>
            <div className="journal-chip-group">
              {allTags.map(tag => (
                <FilterChip
                  key={tag}
                  active={filterTag === tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  count={activeCount(tag, "tag")}
                >
                  {tag}
                </FilterChip>
              ))}
            </div>
          </div>
        )}
      </section>

      {displayTrades.length === 0 ? (
        <EmptyState
          T={T}
          icon="Journal"
          title="No trades match this view"
          copy="Clear a filter or log the next clean execution."
          action={<Btn onClick={onNew}>+ Log Trade</Btn>}
        />
      ) : (
        <section className="journal-table-wrap" aria-label="Trade journal table">
          <table>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const sortable = header.column.getCanSort();
                    const align = header.column.columnDef.meta?.align;
                    return (
                      <th
                        key={header.id}
                        className={align === "right" ? "right" : ""}
                        style={{ width: header.column.columnDef.size ? `${header.column.columnDef.size}px` : undefined }}
                      >
                        {sortable ? (
                          <button
                            type="button"
                            className={sortKey === header.column.id ? "sorted" : ""}
                            onClick={() => cycleSort(header.column.id)}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span>{sortGlyph(header.column.id)}</span>
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const trade = row.original;
                const isExpanded = expandedId === trade._dbid;
                return (
                  <FragmentRow
                    key={trade._dbid}
                    row={row}
                    trade={trade}
                    index={index}
                    isExpanded={isExpanded}
                    columnCount={columns.length}
                    onToggle={() => toggleExpanded(trade._dbid)}
                    onViewImg={onViewImg}
                  />
                );
              })}
            </tbody>
          </table>
          <div className="journal-table-footer">
            <span>Showing {displayTrades.length} of {filtered.length} trades</span>
            <strong className={stats.totalR >= 0 ? "positive" : "negative"}>Net R - {fmtRR(stats.totalR)}</strong>
          </div>
        </section>
      )}
    </div>
  );
}

function FragmentRow({ row, trade, index, isExpanded, columnCount, onToggle, onViewImg }) {
  const rowTone = trade.result === "WIN" ? "row-win" : trade.result === "LOSS" ? "row-loss" : "row-be";
  const rowAlt = index % 2 ? "row-alt" : "";

  return (
    <>
      <tr
        className={`${rowTone} ${rowAlt} ${isExpanded ? "expanded" : ""}`}
        onClick={onToggle}
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
      >
        {row.getVisibleCells().map(cell => {
          const align = cell.column.columnDef.meta?.align;
          return (
            <td key={cell.id} className={align === "right" ? "right" : ""}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            className="detail-row"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <td colSpan={columnCount}>
              <TradeDetail trade={trade} onViewImg={onViewImg} />
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

function TradeDetail({ trade, onViewImg }) {
  const tags = [...new Map((trade.tags || []).map(tag => [normalizeTag(tag), normalizeTag(tag)])) .values()].filter(Boolean);
  const confluences = tags.filter(tag => isConfluenceTag(tag));
  const pre = normalizeImageList(trade.preScreenshot)[0];
  const post = normalizeImageList(trade.postScreenshot)[0];
  const hasNotes = Boolean(String(trade.notes || "").trim());

  return (
    <div className="detail-content">
      <div className="detail-review">
        <DetailTitle>Notes</DetailTitle>
        <p className={`detail-notes ${hasNotes ? "" : "empty"}`}>
          {hasNotes ? trade.notes : "No notes yet. Add your reasoning, lesson, or what you would repeat."}
        </p>

        <DetailTitle>Confluences</DetailTitle>
        <PillRow items={confluences.length ? confluences : ["No confluence tags"]} muted={!confluences.length} />

        <DetailTitle>Tags</DetailTitle>
        <PillRow items={tags.length ? tags : ["No tags"]} muted={!tags.length} />
      </div>

      <div className="detail-evidence">
        <DetailTitle>Charts</DetailTitle>
        <div className="screenshots-grid">
          <ScreenshotThumb label="PRE CHART" src={pre} onClick={() => pre && onViewImg(pre)} />
          <ScreenshotThumb label="POST CHART" src={post} onClick={() => post && onViewImg(post)} />
        </div>
        <div className="detail-meta-list">
          <MetaRow label="Session" value={trade.session || "-"} />
          <MetaRow label="Setup" value={trade.setup || "-"} />
          <MetaRow label="Bias" value={trade.dailyBias || "-"} />
          <MetaRow label="Emotion" value={trade.emotion || "-"} />
        </div>
      </div>
    </div>
  );
}

function ActionButtons({ expanded, onExpand, onEdit, onDelete }) {
  return (
    <span className="row-actions">
      <button type="button" onClick={onExpand} aria-label={expanded ? "Collapse trade details" : "Expand trade details"}>
        <ChevronDown size={13} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      <button type="button" onClick={onEdit} aria-label="Edit trade">
        <Pencil size={13} />
      </button>
      <button type="button" onClick={onDelete} aria-label="Delete trade" className="delete">
        <X size={13} />
      </button>
    </span>
  );
}

function StatCell({ label, value, sub, tone, gradient }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-val ${tone || ""} ${gradient ? "gradient" : ""}`}>{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function FilterChip({ active, onClick, children, count }) {
  return (
    <button type="button" className={`filter-chip ${active ? "active" : ""}`} onClick={onClick}>
      <span>{children}</span>
      {count !== null && count !== undefined && <span className="chip-count">{count}</span>}
    </button>
  );
}

function DirectionBadge({ direction }) {
  if (!direction) return <span className="meta-cell">-</span>;
  return <span className="dir-badge">{direction}</span>;
}

function DateCell({ date }) {
  const parts = String(fmtDate(date)).split(" ").filter(Boolean);
  return (
    <span className="date-cell">
      <strong>{parts[0] || "-"}</strong>
      <span>{parts.slice(1).join(" ")}</span>
    </span>
  );
}

function PairCell({ trade }) {
  return (
    <span className="pair-stack">
      <strong>{trade.pair || "-"}</strong>
    </span>
  );
}

function ResultPill({ result }) {
  const cls = result === "WIN" ? "win" : result === "LOSS" ? "loss" : "be";
  return <span className={`result-pill ${cls}`}>{result || "B/E"}</span>;
}

function RRCell({ T, value }) {
  const numeric = Number(value) || 0;
  return (
    <span className="r-cell" style={{ color: numeric >= 0 ? T.green : T.red }}>
      {fmtRR(numeric)}
    </span>
  );
}

function MetaCell({ value }) {
  return <span className="meta-cell">{value || "-"}</span>;
}

function SetupCell({ value }) {
  return <span className="setup-cell" title={value || "-"}>{value || "-"}</span>;
}

function BiasCell({ bias }) {
  const cls = bias === "Bullish" ? "bullish" : bias === "Bearish" ? "bearish" : "neutral";
  return (
    <span className={`meta-cell bias-cell ${cls}`}>
      <i aria-hidden="true" />
      {bias || "-"}
    </span>
  );
}

function EmotionCell({ emotion }) {
  const lower = String(emotion || "").toLowerCase();
  const cls = lower.includes("revenge") ? "danger" : "";
  return <span className={`meta-cell emotion-cell ${cls}`}>{emotion || "-"}</span>;
}

function DetailTitle({ children }) {
  return <h4 className="detail-title">{children}</h4>;
}

function MetaRow({ label, value }) {
  return (
    <div className="meta-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PillRow({ items, muted }) {
  return (
    <div className="pill-row">
      {items.map(item => <span key={item} className={muted ? "muted" : ""}>{item}</span>)}
    </div>
  );
}

function ScreenshotThumb({ label, src, onClick }) {
  return (
    <button
      type="button"
      className={`screenshot-thumb ${src ? "" : "empty"}`}
      onClick={onClick}
      disabled={!src}
      aria-label={src ? `Open ${label} screenshot` : `${label} screenshot missing`}
    >
      <span>{label}</span>
      {src ? <img src={src} alt={`${label} chart screenshot`} loading="lazy" /> : <em>No chart yet</em>}
    </button>
  );
}

function journalVars(T) {
  return {
    "--surface": T.surface,
    "--surface-2": T.surface2,
    "--line": T.border,
    "--ink": T.text,
    "--ink-2": T.textDim,
    "--dim": T.muted,
    "--green": T.green,
    "--red": T.red,
    "--amber": T.amber,
    "--indigo": T.accentBright,
    "--pink": T.pink,
    "--bg": T.bg,
  };
}

function journalCSS(T) {
  const brutal = !!T.hardShadow;
  const isDark = T.isDark && !brutal;
  const borderWidth = brutal ? "2px" : "1px";
  const radius = brutal ? "4px" : "12px";
  const hover = brutal ? "transparent" : isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)";
  const expanded = isDark ? "rgba(129,140,248,0.06)" : "rgba(99,102,241,0.08)";
  const filterBg = isDark ? "rgba(15,15,20,0.86)" : `${T.surface}f2`;
  const blur = brutal ? "none" : "blur(24px)";
  const softLine = brutal ? T.border : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.06)";
  const zebra = brutal ? "transparent" : isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)";
  const bentoSurface = brutal
    ? "var(--surface)"
    : isDark
      ? "radial-gradient(620px circle at 92% 6%, rgba(129,140,248,.12), transparent 58%), radial-gradient(460px circle at 6% 96%, rgba(52,211,153,.08), transparent 58%), linear-gradient(135deg, rgba(255,255,255,.038), rgba(255,255,255,.010)), var(--surface)"
      : "linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,248,245,.98)), var(--surface)";
  const bentoShadow = brutal ? "none" : isDark ? "0 18px 52px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.045)" : "0 16px 46px rgba(17,24,39,.06)";

  return `
    .journal-power-table {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .journal-command-deck {
      position: relative;
      border: ${borderWidth} solid var(--line);
      border-radius: ${brutal ? "4px" : "18px"};
      background: ${bentoSurface};
      box-shadow: ${bentoShadow};
      overflow: hidden;
    }

    .journal-command-deck::before {
      content: "";
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: ${brutal ? "transparent" : "linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent)"};
      pointer-events: none;
      z-index: 2;
    }

    .journal-command-deck::after {
      content: "";
      position: absolute;
      right: -110px;
      top: -140px;
      width: 420px;
      height: 300px;
      border-radius: 999px;
      background: ${brutal ? "transparent" : "radial-gradient(circle, rgba(129,140,248,.18), transparent 66%)"};
      pointer-events: none;
    }

    .journal-command-deck > * {
      position: relative;
      z-index: 1;
    }

    .journal-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 18px 20px 14px;
    }

    .journal-page-header::before {
      content: none;
    }

    .journal-page-header > * {
      position: relative;
      z-index: 1;
    }

    .journal-eyebrow {
      display: block;
      margin: 0 0 7px;
      color: var(--dim);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .journal-page-header h1 {
      margin: 0 0 5px;
      font-size: 30px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: -0.045em;
      color: var(--ink);
    }

    .journal-page-header h1 span {
      color: var(--ink);
    }

    .journal-page-header p {
      margin: 0;
      color: var(--dim);
      font-size: 12px;
    }

    .journal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      flex-wrap: wrap;
    }

    .journal-action {
      min-height: 44px;
      border-radius: 999px;
      padding: 0 18px;
      font-family: var(--font-geist-sans);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: transform .15s, border-color .15s, background .15s, color .15s;
    }

    .journal-action:hover {
      transform: translateY(-1px);
    }

    .journal-action.secondary {
      background: ${brutal ? "transparent" : isDark ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.018)"};
      color: var(--ink-2);
      border: ${borderWidth} solid var(--line);
    }

    .journal-action.secondary:hover {
      border-color: var(--indigo);
      color: var(--ink);
    }

    .journal-action.primary {
      background: ${brutal ? (T.accentFill || T.accentBright) : "linear-gradient(135deg, #6366f1, #ec4899)"} !important;
      color: ${brutal ? T.text : "#fff"} !important;
      border: ${brutal ? `2px solid ${T.border}` : "none"} !important;
      font-weight: 800 !important;
      box-shadow: ${brutal ? "none" : "0 14px 34px rgba(129,140,248,.24)"};
    }

    .journal-stat-strip {
      position: relative;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1px;
      background: ${brutal ? "var(--line)" : isDark ? "rgba(255,255,255,.032)" : "rgba(0,0,0,.052)"};
      border: 0;
      border-top: ${borderWidth} solid ${softLine};
      border-radius: 0;
      overflow: hidden;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    .journal-stat-strip::before {
      content: none;
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: ${brutal ? "transparent" : "linear-gradient(90deg, transparent, rgba(129,140,248,.5), transparent)"};
      pointer-events: none;
      z-index: 1;
    }

    .journal-stat-strip .stat {
      position: relative;
      background: ${isDark ? "linear-gradient(135deg, rgba(255,255,255,.026), rgba(255,255,255,.006))" : "rgba(255,255,255,.42)"};
      padding: 13px 20px 14px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
      min-height: 56px;
      min-width: 0;
      overflow: hidden;
    }

    .journal-stat-strip .stat::after {
      content: "";
      position: absolute;
      right: -34px;
      bottom: -42px;
      width: 112px;
      height: 112px;
      border-radius: 999px;
      background: ${brutal ? "transparent" : "radial-gradient(circle, rgba(129,140,248,.075), transparent 64%)"};
      pointer-events: none;
    }

    .stat-label {
      font-size: 9px;
      color: var(--dim);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 650;
    }

    .stat-val {
      font-family: var(--font-geist-mono), 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
      font-feature-settings: "tnum";
      color: var(--ink);
    }

    .stat-val.green { color: var(--green); }
    .stat-val.red { color: var(--red); }
    .stat-val.gradient {
      color: var(--green);
    }

    .stat-sub {
      font-size: 10px;
      color: var(--dim);
    }

    .journal-filter-bar {
      position: sticky;
      top: 80px;
      z-index: 50;
      display: grid;
      gap: 10px;
      padding: 12px;
      background: ${isDark ? "radial-gradient(620px circle at 96% 0%, rgba(129,140,248,.12), transparent 58%), radial-gradient(420px circle at 2% 100%, rgba(52,211,153,.075), transparent 60%), linear-gradient(180deg, rgba(20,20,28,.94), rgba(15,15,20,.88))" : filterBg};
      border: ${borderWidth} solid var(--line);
      border-radius: ${brutal ? radius : "18px"};
      backdrop-filter: ${blur};
      -webkit-backdrop-filter: ${blur};
      box-shadow: ${brutal ? "none" : "0 18px 54px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.055), inset 0 -1px 0 rgba(255,255,255,.035)"};
      overflow: hidden;
    }

    .journal-filter-bar::before {
      content: "";
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: ${brutal ? "transparent" : "linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent)"};
      pointer-events: none;
    }

    .journal-filter-main {
      display: grid;
      grid-template-columns: minmax(280px, 1fr) auto auto;
      align-items: stretch;
      gap: 10px;
    }

    .journal-search {
      position: relative;
      display: flex;
      align-items: center;
      color: var(--dim);
      min-width: 0;
      min-height: 42px;
      background: ${isDark ? "rgba(255,255,255,.026)" : "rgba(0,0,0,.018)"};
      border: ${borderWidth} solid ${softLine};
      border-radius: ${brutal ? "3px" : "12px"};
      transition: border-color .15s ease, background .15s ease, box-shadow .15s ease;
    }

    .journal-search:focus-within {
      border-color: rgba(129,140,248,.52);
      background: ${isDark ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.72)"};
      box-shadow: ${brutal ? "none" : "0 0 0 3px rgba(129,140,248,.12)"};
    }

    .journal-search svg {
      position: absolute;
      left: 13px;
      pointer-events: none;
    }

    .journal-search input {
      width: 100%;
      background: transparent;
      border: 0;
      color: var(--ink);
      font-family: var(--font-geist-sans);
      font-size: 12px;
      min-height: 40px;
      padding: 9px 12px 9px 36px;
      border-radius: inherit;
      outline: none;
    }

    .journal-search input:focus {
      box-shadow: none;
    }

    .journal-filter-cluster {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 42px;
      padding: 5px 7px 5px 11px;
      background: ${isDark ? "rgba(255,255,255,.024)" : "rgba(0,0,0,.014)"};
      border: ${borderWidth} solid ${softLine};
      border-radius: ${brutal ? "3px" : "999px"};
      min-width: 0;
    }

    .journal-filter-cluster.compact {
      padding-left: 10px;
    }

    .journal-filter-label {
      color: var(--dim);
      font-size: 9px;
      font-weight: 750;
      letter-spacing: .15em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .journal-chip-group,
    .journal-tags-filter {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }

    .journal-tags-filter {
      align-items: center;
      gap: 8px;
      padding: 9px 0 0;
      border-top: ${borderWidth} solid ${softLine};
    }

    .filter-chip {
      padding: 5px 10px;
      background: transparent;
      border: ${borderWidth} solid var(--line);
      border-radius: ${brutal ? "3px" : "100px"};
      color: var(--dim);
      cursor: pointer;
      transition: background .15s, color .15s, border-color .15s, opacity .15s;
      font-family: var(--font-geist-sans);
      font-size: 11px;
      font-weight: 650;
      min-height: 28px;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .filter-chip:hover {
      color: var(--ink-2);
      border-color: var(--indigo);
      background: ${brutal ? "transparent" : "rgba(255,255,255,0.04)"};
    }

    .filter-chip.active {
      background: rgba(129,140,248,0.15);
      color: var(--ink);
      border-color: rgba(129,140,248,0.4);
      font-weight: 800;
    }

    .chip-count {
      display: inline-grid;
      place-items: center;
      min-width: 16px;
      height: 16px;
      padding: 0 5px;
      border-radius: 999px;
      background: rgba(129,140,248,.18);
      color: var(--ink-2);
      font-family: var(--font-geist-mono), 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      font-feature-settings: "tnum";
    }

    .journal-table-wrap {
      position: relative;
      background: ${bentoSurface};
      border: ${borderWidth} solid var(--line);
      border-radius: ${brutal ? radius : "16px"};
      overflow: hidden;
      box-shadow: ${brutal ? "none" : "0 24px 74px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.04)"};
      backdrop-filter: ${blur};
      -webkit-backdrop-filter: ${blur};
    }

    .journal-table-wrap::before {
      content: "";
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: ${brutal ? "transparent" : "linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent)"};
      z-index: 3;
      pointer-events: none;
    }

    .journal-table-wrap table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      table-layout: auto;
    }

    .journal-table-wrap thead {
      background: ${isDark ? "linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.018)), var(--surface-2)" : "var(--surface-2)"};
      border-bottom: ${borderWidth} solid ${softLine};
    }

    .journal-table-wrap th {
      padding: 12px 14px;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--dim);
      font-weight: 650;
      white-space: nowrap;
      text-align: left;
    }

    .journal-table-wrap th.right,
    .journal-table-wrap td.right {
      text-align: right;
    }

    .journal-table-wrap th button {
      appearance: none;
      border: 0;
      background: none;
      color: inherit;
      cursor: pointer;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font: inherit;
      text-transform: inherit;
      letter-spacing: inherit;
    }

    .journal-table-wrap th button span {
      opacity: .4;
      color: var(--dim);
    }

    .journal-table-wrap th button.sorted span {
      opacity: 1;
      color: var(--indigo);
    }

    .journal-table-wrap tbody tr {
      cursor: pointer;
      transition: background .12s ease;
      position: relative;
    }

    .journal-table-wrap tbody tr:focus-visible {
      outline: 2px solid var(--indigo);
      outline-offset: -2px;
    }

    .journal-table-wrap td {
      padding: 10px 14px;
      font-size: 12px;
      color: var(--ink-2);
      vertical-align: middle;
      background: transparent;
      border-bottom: ${borderWidth} solid ${softLine};
      transition: background .12s ease, border-color .12s ease;
    }

    .journal-table-wrap td:first-child {
      position: relative;
    }

    .journal-table-wrap tbody tr.row-alt td {
      background: ${zebra};
    }

    .journal-table-wrap tbody tr:hover td {
      background: ${brutal ? hover : isDark ? "rgba(129,140,248,.035)" : "rgba(99,102,241,.035)"};
      border-color: ${brutal ? T.border : "rgba(129,140,248,.12)"};
    }

    .journal-table-wrap tbody tr.expanded td {
      background: ${expanded};
      border-color: ${brutal ? T.border : "rgba(129,140,248,.22)"};
    }

    .journal-table-wrap tbody tr.expanded td:first-child::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--indigo);
      box-shadow: ${brutal ? "none" : "0 0 12px rgba(129,140,248,0.4)"};
    }

    .date-cell,
    .pair-stack,
    .r-cell,
    .mono {
      font-family: var(--font-geist-mono), 'JetBrains Mono', monospace;
      font-feature-settings: "tnum";
    }

    .date-cell {
      display: inline-flex;
      align-items: baseline;
      gap: 6px;
      white-space: nowrap;
    }

    .date-cell strong {
      color: var(--ink-2);
      font-size: 12px;
      font-weight: 800;
    }

    .date-cell span {
      color: var(--dim);
      font-size: 11px;
      font-weight: 650;
    }

    .row-win .date-cell strong,
    .row-loss .date-cell strong,
    .row-be .date-cell strong {
      color: var(--ink);
    }

    .pair-stack {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      color: var(--ink);
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .pair-stack strong {
      text-shadow: ${isDark && !brutal ? "0 0 18px rgba(129,140,248,.12)" : "none"};
    }

    .journal-table-wrap tbody tr:hover .pair-stack strong,
    .journal-table-wrap tbody tr.expanded .pair-stack strong {
      color: var(--ink);
    }

    .dir-badge {
      display: inline-flex;
      align-items: center;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--dim);
      font-family: var(--font-geist-mono), 'JetBrains Mono', monospace;
    }

    .result-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: var(--ink-2);
    }

    .result-pill::before {
      content: "";
      width: 5px;
      height: 5px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .result-pill.win::before { background: var(--green); }
    .result-pill.loss::before { background: var(--red); }
    .result-pill.be::before { background: var(--amber); }

    .r-cell {
      font-weight: 850;
      letter-spacing: -0.03em;
    }

    .meta-cell {
      color: var(--dim);
      font-size: 11px;
    }

    .setup-cell {
      display: inline-block;
      max-width: 190px;
      color: var(--ink-2);
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
    }

    .journal-table-wrap tbody tr:hover .setup-cell,
    .journal-table-wrap tbody tr.expanded .setup-cell {
      color: var(--ink);
    }

    .bias-cell {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--dim);
    }

    .bias-cell i {
      width: 4px;
      height: 4px;
      border-radius: 999px;
      background: var(--dim);
      opacity: .75;
    }

    .bias-cell.bullish i { background: var(--green); }
    .bias-cell.bearish i { background: var(--red); }
    .bias-cell.neutral i { background: var(--dim); }
    .emotion-cell.danger { color: var(--red); }

    .row-actions {
      display: inline-flex;
      justify-content: flex-end;
      gap: 4px;
      opacity: 0;
      transition: opacity .15s;
    }

    tr:hover .row-actions,
    tr.expanded .row-actions,
    tr:focus-within .row-actions {
      opacity: 1;
    }

    .row-actions button {
      width: 24px;
      height: 24px;
      border-radius: 5px;
      background: rgba(255,255,255,0.04);
      border: ${borderWidth} solid var(--line);
      color: var(--dim);
      display: inline-grid;
      place-items: center;
      cursor: pointer;
      transition: color .15s, background .15s, border-color .15s;
      padding: 0;
    }

    .row-actions button:hover {
      color: var(--ink);
      border-color: var(--indigo);
      background: rgba(129,140,248,0.1);
    }

    .row-actions button.delete:hover {
      color: var(--red);
      border-color: var(--red);
      background: rgba(251,113,133,0.12);
    }

    .journal-table-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border-top: ${borderWidth} solid ${softLine};
      color: var(--dim);
      font-size: 11px;
    }

    .journal-table-footer strong {
      font-family: var(--font-geist-mono), 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      font-feature-settings: "tnum";
    }

    .journal-table-footer strong.positive { color: var(--green); }
    .journal-table-footer strong.negative { color: var(--red); }

    .detail-row,
    .detail-row:hover {
      cursor: default !important;
      background: var(--surface-2) !important;
    }

    .detail-row td {
      padding: 0;
      border: 0;
    }

    .detail-content {
      padding: 20px 24px;
      background: var(--surface-2);
      border-top: ${borderWidth} solid var(--line);
      border-bottom: ${brutal ? `2px solid ${T.border}` : "2px solid var(--indigo)"};
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(300px, 1fr);
      gap: 24px;
    }

    .detail-review,
    .detail-evidence {
      min-width: 0;
    }

    .detail-title {
      margin: 0 0 10px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--dim);
    }

    .detail-notes {
      margin: 0 0 16px;
      color: var(--ink-2);
      font-size: 13px;
      line-height: 1.6;
      max-width: 80ch;
      position: relative;
      z-index: 1;
    }

    .detail-notes.empty {
      color: var(--dim);
      font-style: italic;
    }

    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin: -4px 0 14px;
      position: relative;
      z-index: 1;
    }

    .pill-row span {
      background: rgba(99,102,241,0.08);
      color: var(--indigo);
      border: ${borderWidth} solid rgba(99,102,241,0.18);
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: ${brutal ? "3px" : "6px"};
    }

    .pill-row span.muted {
      color: var(--dim);
      border-color: var(--line);
      background: var(--surface);
    }

    .detail-meta-list {
      margin-top: 12px;
      display: grid;
      gap: 5px;
    }

    .meta-row {
      display: grid;
      grid-template-columns: 74px minmax(0, 1fr);
      gap: 10px;
      align-items: baseline;
      font-size: 11px;
    }

    .meta-row span {
      color: var(--dim);
      font-weight: 600;
    }

    .meta-row strong {
      color: var(--ink-2);
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .screenshots-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      position: relative;
      z-index: 1;
    }

    .screenshot-thumb {
      position: relative;
      aspect-ratio: 16 / 10.5;
      border-radius: ${brutal ? "4px" : "10px"};
      border: ${borderWidth} solid var(--line);
      overflow: hidden;
      background: ${isDark ? "linear-gradient(135deg, rgba(255,255,255,.028), rgba(255,255,255,.01)), var(--surface)" : "var(--surface)"};
      cursor: pointer;
      padding: 0;
      color: var(--dim);
      display: grid;
      place-items: center;
      font-family: var(--font-geist-sans);
      transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
    }

    .screenshot-thumb:not(:disabled):hover {
      transform: translateY(-2px);
      border-color: rgba(129,140,248,.55);
      box-shadow: ${brutal ? "none" : "0 14px 34px rgba(0,0,0,.22)"};
    }

    .screenshot-thumb:disabled {
      cursor: default;
    }

    .screenshot-thumb span {
      position: absolute;
      top: 6px;
      left: 6px;
      z-index: 1;
      padding: 2px 5px;
      border-radius: 4px;
      background: rgba(0,0,0,.56);
      color: #fff;
      font-size: 9px;
      font-weight: 850;
      letter-spacing: .1em;
    }

    .screenshot-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform .22s ease;
    }

    .screenshot-thumb:not(:disabled):hover img {
      transform: scale(1.035);
    }

    .screenshot-thumb em {
      font-style: normal;
      font-size: 11px;
      color: var(--dim);
    }

    .screenshot-thumb.empty::after {
      content: "";
      position: absolute;
      inset: 16px;
      border: 1px dashed var(--line);
      border-radius: ${brutal ? "3px" : "8px"};
      opacity: .8;
      pointer-events: none;
    }

    @media (max-width: 768px) {
      .journal-page-header {
        flex-direction: column;
      }

      .journal-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .journal-stat-strip {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .journal-filter-bar {
        top: 66px;
      }

      .journal-filter-main {
        grid-template-columns: 1fr;
      }

      .journal-filter-cluster,
      .journal-filter-cluster.compact,
      .journal-tags-filter {
        align-items: flex-start;
        flex-direction: column;
        border-radius: ${brutal ? "3px" : "12px"};
        padding: 10px;
      }

      .journal-tags-filter {
        border-top: ${borderWidth} solid ${softLine};
      }

      .journal-table-wrap {
        overflow-x: auto;
      }

      .journal-table-wrap table {
        min-width: 640px;
      }

      .row-actions {
        opacity: 1;
      }

      .detail-content {
        grid-template-columns: 1fr;
        padding: 16px;
      }

      .screenshots-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}

function pairLabel(pair) {
  if (pair === "ALL") return "All";
  if (pair === "EURUSD") return "EUR/USD";
  if (pair === "GBPUSD") return "GBP/USD";
  if (pair === "USDCAD") return "USD/CAD";
  return pair;
}

function normalizeTag(tag) {
  const clean = String(tag || "").trim();
  const lower = clean.toLowerCase();
  if (!clean) return "";
  if (lower.includes("htf") && (lower.includes("align") || lower.includes("bias") || lower.includes("profile"))) return "HTF aligned";
  if (lower.includes("a+") || lower.includes("a plus")) return "A+ setup";
  return clean;
}

function isConfluenceTag(tag) {
  const lower = String(tag || "").toLowerCase();
  return lower.includes("htf") ||
    lower.includes("a+") ||
    lower.includes("aligned") ||
    lower.includes("setup") ||
    lower.includes("confluence") ||
    lower.includes("bias");
}

function getTradeSearchText(trade) {
  return [
    trade.pair,
    trade.direction,
    trade.session,
    trade.result,
    trade.dailyBias,
    trade.weeklyBias,
    trade.setup,
    trade.manipulation,
    trade.poi,
    trade.emotion,
    trade.mistakes,
    trade.notes,
    ...(trade.tags || []).map(normalizeTag),
  ].filter(Boolean).join(" ").toLowerCase();
}

export default Journal;
