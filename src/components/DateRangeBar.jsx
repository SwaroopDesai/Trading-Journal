"use client"

import { Badge } from "@/components/ui/badge";
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
  return (
    <div
      className="date-range-bar border-b bg-card px-7 py-2"
      style={{ borderBottomColor:T.border, background:T.surface }}
    >
      <div className="flex w-full flex-wrap items-center gap-2.5">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color:T.muted }}>
          Period
        </span>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map(p => (
            <Button
              key={p.id}
              type="button"
              variant={value === p.id ? "secondary" : "outline"}
              size="xs"
              onClick={() => onChange(p.id)}
              className={cn(
                "fx-btn rounded-full px-3 font-bold tracking-[0.05em]",
                value === p.id && "border-primary bg-primary/10 text-primary"
              )}
              style={{
                color: value===p.id ? T.accentBright : T.textDim,
                borderColor: value===p.id ? T.accentBright : T.border,
                background: value===p.id ? `${T.accent}22` : "transparent",
              }}
            >{p.label}</Button>
          ))}
        </div>
        {value !== "all" && (
          <Badge variant="outline" className="ml-1 rounded-full font-normal" style={{ color:T.textDim, borderColor:T.border }}>
            {count} trade{count !== 1 ? "s" : ""} - {total - count} outside range
          </Badge>
        )}
      </div>
    </div>
  )
}
