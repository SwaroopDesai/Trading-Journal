"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Pencil, Search, Table2, X } from "lucide-react";
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
        cell: ({ row }) => <span className="journal-date">{fmtDate(row.original.date)}</span>,
      },
      {
        id: "pair",
        accessorKey: "pair",
        header: "Pair",
        enableSorting: true,
        cell: ({ row }) => <span className="pair-cell">{row.original.pair}</span>,
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
        cell: ({ row }) => <MetaCell value={row.original.setup} />,
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

  function sortArrow(columnId) {
    if (sortKey !== columnId) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

  return (
    <div
      className={`journal-power-table ${isBrutal ? "journal-brutal" : ""}`}
      style={journalVars(T)}
    >
      <style>{journalCSS(T)}</style>

      <header className="journal-page-header">
        <div>
          <h1>Trade <span>Journal</span></h1>
          <p>
            {stats.total} trades • {fmtRR(stats.totalR)} net • {stats.wins}W / {stats.losses}L
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

      <section className="journal-stat-strip" aria-label="Journal stats">
        <StatCell label="Total Trades" value={stats.total} sub="in current view" />
        <StatCell label="Net R" value={fmtRR(stats.totalR)} sub={`${stats.wins} wins / ${stats.losses} losses`} tone={stats.totalR >= 0 ? "green" : "red"} gradient={stats.totalR > 0} />
        <StatCell label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} sub="filtered trades" tone={stats.winRate >= 50 ? "green" : "red"} />
        <StatCell label="Avg Win" value={fmtRR(stats.avgWin)} sub="winning trades" tone="green" />
        <StatCell label="Avg Loss" value={fmtRR(stats.avgLoss)} sub="losing trades" tone="red" />
      </section>

      <section className="journal-filter-bar" aria-label="Journal filters">
        <div className="journal-search">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search notes, setup, emotion, tags..."
            aria-label="Search trades"
          />
        </div>

        <div className="journal-chip-group" aria-label="Pair filter">
          {PAIR_ORDER.filter(pair => pair === "ALL" || PAIRS.includes(pair)).map(pair => (
            <FilterChip
              key={pair}
              active={filterPair === pair}
              onClick={() => setFilterPair(pair)}
            >
              {pairLabel(pair)}
            </FilterChip>
          ))}
        </div>

        <div className="journal-divider" aria-hidden="true" />

        <div className="journal-chip-group" aria-label="Result filter">
          {RESULT_FILTERS.map(result => (
            <FilterChip
              key={result.value}
              active={filterResult === result.value}
              onClick={() => setFilterResult(result.value)}
            >
              {result.label}
            </FilterChip>
          ))}
        </div>

        <div className="journal-view-toggle" aria-label="Journal view">
          <button className="active" type="button"><Table2 size={13} aria-hidden="true" /> Table</button>
          <button type="button" disabled title="Card view removed for power-table mode">Cards</button>
        </div>

        {allTags.length > 0 && (
          <div className="journal-tags-filter" aria-label="Tag filter">
            {allTags.map(tag => (
              <FilterChip
                key={tag}
                active={filterTag === tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              >
                {tag}
              </FilterChip>
            ))}
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
                            <span>{sortArrow(header.column.id)}</span>
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
              {rows.map(row => {
                const trade = row.original;
                const isExpanded = expandedId === trade._dbid;
                return (
                  <FragmentRow
                    key={trade._dbid}
                    row={row}
                    trade={trade}
                    isExpanded={isExpanded}
                    columnCount={columns.length}
                    onToggle={() => toggleExpanded(trade._dbid)}
                    onViewImg={onViewImg}
                  />
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function FragmentRow({ row, trade, isExpanded, columnCount, onToggle, onViewImg }) {
  return (
    <>
      <tr
        className={isExpanded ? "expanded" : ""}
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

  return (
    <div className="detail-content">
      <div>
        <DetailTitle>Trade Notes</DetailTitle>
        <p className="detail-notes">{trade.notes || "No notes logged for this execution."}</p>

        <DetailTitle>Confluences</DetailTitle>
        <PillRow items={confluences.length ? confluences : ["No confluence tags"]} muted={!confluences.length} />

        <DetailTitle>Tags</DetailTitle>
        <PillRow items={tags.length ? tags : ["No tags"]} muted={!tags.length} />
      </div>

      <div>
        <DetailTitle>Screenshots</DetailTitle>
        <div className="screenshots-grid">
          <ScreenshotThumb label="PRE" src={pre} onClick={() => pre && onViewImg(pre)} />
          <ScreenshotThumb label="POST" src={post} onClick={() => post && onViewImg(post)} />
        </div>
        <div className="meta-grid">
          <MetaItem label="Entry" value={trade.entry} mono />
          <MetaItem label="SL" value={trade.sl} mono />
          <MetaItem label="TP" value={trade.tp} mono />
          <MetaItem label="Pips" value={trade.pips || "+0"} mono />
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
      <span className="stat-sub">{sub}</span>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button type="button" className={`filter-chip ${active ? "active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function DirectionBadge({ direction }) {
  if (!direction) return <span className="meta-cell">-</span>;
  return <span className={`dir-badge ${direction === "LONG" ? "long" : "short"}`}>{direction}</span>;
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

function BiasCell({ bias }) {
  const cls = bias === "Bullish" ? "bullish" : bias === "Bearish" ? "bearish" : "";
  return <span className={`meta-cell bias-cell ${cls}`}>{bias || "-"}</span>;
}

function EmotionCell({ emotion }) {
  const lower = String(emotion || "").toLowerCase();
  const cls = lower.includes("revenge") ? "danger" : lower.includes("anxious") || lower.includes("impatient") ? "warning" : "";
  return <span className={`meta-cell emotion-cell ${cls}`}>{emotion || "-"}</span>;
}

function DetailTitle({ children }) {
  return <h4 className="detail-title">{children}</h4>;
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
      {src ? <img src={src} alt={`${label} chart screenshot`} loading="lazy" /> : <em>No image</em>}
    </button>
  );
}

function MetaItem({ label, value, mono }) {
  return (
    <div className="meta-item">
      <span className="k">{label}</span>
      <span className={mono ? "v mono" : "v"}>{value || "-"}</span>
    </div>
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
  const hover = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";
  const expanded = isDark ? "rgba(129,140,248,0.04)" : "rgba(99,102,241,0.07)";
  const filterBg = isDark ? "rgba(15,15,20,0.82)" : `${T.surface}ee`;
  const blur = brutal ? "none" : "blur(20px)";

  return `
    .journal-power-table {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .journal-page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .journal-page-header h1 {
      margin: 0 0 4px;
      font-size: 28px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: -0.045em;
      color: var(--ink);
    }

    .journal-page-header h1 span {
      background: ${brutal ? "none" : "linear-gradient(135deg, var(--ink), rgba(255,255,255,0.7))"};
      -webkit-background-clip: ${brutal ? "initial" : "text"};
      background-clip: ${brutal ? "initial" : "text"};
      color: ${brutal ? "var(--ink)" : "transparent"};
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
      background: transparent;
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
    }

    .journal-stat-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1px;
      background: var(--line);
      border: ${borderWidth} solid var(--line);
      border-radius: ${radius};
      overflow: hidden;
    }

    .journal-stat-strip .stat {
      background: var(--surface);
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .stat-label {
      font-size: 10px;
      color: var(--dim);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 650;
    }

    .stat-val {
      font-family: var(--font-geist-mono), 'JetBrains Mono', monospace;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      font-feature-settings: "tnum";
      color: var(--ink);
    }

    .stat-val.green { color: var(--green); }
    .stat-val.red { color: var(--red); }
    .stat-val.gradient {
      background: ${brutal ? "none" : "linear-gradient(135deg, var(--green), #10b981)"};
      -webkit-background-clip: ${brutal ? "initial" : "text"};
      background-clip: ${brutal ? "initial" : "text"};
      color: ${brutal ? "var(--green)" : "transparent"};
    }

    .stat-sub {
      font-size: 11px;
      color: var(--dim);
    }

    .journal-filter-bar {
      position: sticky;
      top: 80px;
      z-index: 50;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 10px 14px;
      background: ${filterBg};
      border: ${borderWidth} solid var(--line);
      border-radius: ${radius};
      backdrop-filter: ${blur};
      -webkit-backdrop-filter: ${blur};
    }

    .journal-search {
      flex: 1 1 240px;
      min-width: 240px;
      position: relative;
      display: flex;
      align-items: center;
      color: var(--dim);
    }

    .journal-search svg {
      position: absolute;
      left: 10px;
      pointer-events: none;
    }

    .journal-search input {
      width: 100%;
      background: var(--surface-2);
      border: ${borderWidth} solid var(--line);
      color: var(--ink);
      font-family: var(--font-geist-sans);
      font-size: 12px;
      min-height: 34px;
      padding: 8px 12px 8px 32px;
      border-radius: ${brutal ? "3px" : "8px"};
      outline: none;
    }

    .journal-search input:focus {
      border-color: var(--indigo);
      box-shadow: ${brutal ? "none" : "0 0 0 3px rgba(129,140,248,0.18)"};
    }

    .journal-chip-group,
    .journal-tags-filter {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }

    .journal-tags-filter {
      flex-basis: 100%;
      padding-top: 2px;
    }

    .filter-chip,
    .journal-view-toggle button {
      padding: 5px 11px;
      background: transparent;
      border: ${borderWidth} solid var(--line);
      border-radius: ${brutal ? "3px" : "100px"};
      color: var(--dim);
      cursor: pointer;
      transition: background .15s, color .15s, border-color .15s, opacity .15s;
      font-family: var(--font-geist-sans);
      font-size: 11px;
      font-weight: 650;
      min-height: 30px;
      white-space: nowrap;
    }

    .filter-chip:hover,
    .journal-view-toggle button:hover:not(:disabled) {
      color: var(--ink-2);
      border-color: var(--indigo);
    }

    .filter-chip.active,
    .journal-view-toggle button.active {
      background: rgba(129,140,248,0.15);
      color: var(--indigo);
      border-color: rgba(129,140,248,0.4);
      font-weight: 800;
    }

    .journal-view-toggle {
      margin-left: auto;
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .journal-view-toggle button {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }

    .journal-view-toggle button:disabled {
      opacity: .42;
      cursor: not-allowed;
    }

    .journal-divider {
      width: 1px;
      height: 20px;
      background: var(--line);
      margin: 0 4px;
    }

    .journal-table-wrap {
      background: var(--surface);
      border: ${borderWidth} solid var(--line);
      border-radius: ${radius};
      overflow: hidden;
    }

    .journal-table-wrap table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }

    .journal-table-wrap thead {
      background: var(--surface-2);
      border-bottom: ${borderWidth} solid var(--line);
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
      border-bottom: ${borderWidth} solid var(--line);
      cursor: pointer;
      transition: background .12s;
      position: relative;
    }

    .journal-table-wrap tbody tr:hover {
      background: ${hover};
    }

    .journal-table-wrap tbody tr.expanded {
      background: ${expanded};
    }

    .journal-table-wrap tbody tr.expanded::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: ${brutal ? T.border : "linear-gradient(180deg, #818cf8, #ec4899)"};
    }

    .journal-table-wrap tbody tr:focus-visible {
      outline: 2px solid var(--indigo);
      outline-offset: -2px;
    }

    .journal-table-wrap td {
      padding: 12px 14px;
      font-size: 12.5px;
      color: var(--ink-2);
      vertical-align: middle;
    }

    .journal-date,
    .pair-cell,
    .r-cell,
    .mono {
      font-family: var(--font-geist-mono), 'JetBrains Mono', monospace;
      font-feature-settings: "tnum";
    }

    .pair-cell {
      color: var(--ink);
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .dir-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
    }

    .dir-badge.long { background: rgba(52,211,153,0.1); color: var(--green); }
    .dir-badge.short { background: rgba(251,113,133,0.1); color: var(--red); }

    .result-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }

    .result-pill::before {
      content: "";
      width: 5px;
      height: 5px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .result-pill.win { background: rgba(52,211,153,0.12); color: var(--green); }
    .result-pill.win::before { background: var(--green); }
    .result-pill.loss { background: rgba(251,113,133,0.12); color: var(--red); }
    .result-pill.loss::before { background: var(--red); }
    .result-pill.be { background: rgba(251,191,36,0.12); color: var(--amber); }
    .result-pill.be::before { background: var(--amber); }

    .r-cell {
      font-weight: 850;
      letter-spacing: -0.03em;
    }

    .meta-cell {
      color: var(--dim);
      font-size: 11px;
    }

    .bias-cell.bullish { color: var(--green); }
    .bias-cell.bearish { color: var(--red); }
    .emotion-cell.warning { color: var(--amber); }
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
      padding: 18px 22px;
      background: var(--surface-2);
      border-top: ${borderWidth} solid var(--line);
      border-bottom: ${brutal ? `2px solid ${T.border}` : "2px solid var(--indigo)"};
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;
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
    }

    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin: -4px 0 14px;
    }

    .pill-row span {
      background: rgba(99,102,241,0.1);
      color: var(--indigo);
      border: ${borderWidth} solid rgba(99,102,241,0.18);
      font-size: 10px;
      font-weight: 750;
      padding: 2px 7px;
      border-radius: 4px;
    }

    .pill-row span.muted {
      color: var(--dim);
      border-color: var(--line);
      background: var(--surface);
    }

    .screenshots-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }

    .screenshot-thumb {
      position: relative;
      aspect-ratio: 16 / 10;
      border-radius: 8px;
      border: ${borderWidth} solid var(--line);
      overflow: hidden;
      background: var(--surface);
      cursor: pointer;
      padding: 0;
      color: var(--dim);
      display: grid;
      place-items: center;
      font-family: var(--font-geist-sans);
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
    }

    .screenshot-thumb em {
      font-style: normal;
      font-size: 11px;
      color: var(--dim);
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .meta-item {
      background: var(--surface);
      border: ${borderWidth} solid var(--line);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .meta-item .k {
      font-size: 9px;
      color: var(--dim);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
    }

    .meta-item .v {
      font-size: 12px;
      color: var(--ink);
      font-weight: 650;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

      .journal-search {
        flex-basis: 100%;
        min-width: 100%;
      }

      .journal-view-toggle {
        margin-left: 0;
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
