"use client"

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = [
  { id: "all", label: "All" },
  { id: "7d",  label: "7D"  },
  { id: "30d", label: "30D" },
  { id: "3m",  label: "3M"  },
  { id: "6m",  label: "6M"  },
  { id: "1y",  label: "1Y"  },
]

export default function DateRangeBar({ T, value, onChange, count, total }) {
  const isFiltered = value !== "all";

  return (
    <div
      className="date-range-bar border-b px-7 py-2"
      style={{
        borderBottomColor:T.border,
        background:T.bg,
      }}
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.16em]" style={{ color:T.muted }}>
            Range
          </span>
          <div
            className="flex items-center gap-0.5 rounded-full border p-0.5"
            style={{ borderColor:T.border, background:T.surface }}
          >
          {PRESETS.map(p => (
            <Button
              key={p.id}
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onChange(p.id)}
              className={cn(
                "fx-btn h-6 rounded-full border-0 px-2.5 text-[10px] font-black tracking-[0.04em] shadow-none",
                value === p.id ? "text-primary-foreground" : "hover:bg-transparent"
              )}
              style={{
                color: value===p.id ? "#fff" : T.textDim,
                background: value===p.id ? T.accent : "transparent",
              }}
            >{p.label}</Button>
          ))}
          </div>
        </div>
        <div
          className="shrink-0 text-[10px] font-medium"
          style={{ color:isFiltered ? T.textDim : T.muted }}
        >
          {isFiltered
            ? `${count} shown · ${Math.max(total - count, 0)} hidden`
            : `${total} total trade${total === 1 ? "" : "s"}`}
        </div>
      </div>
    </div>
  )
}
