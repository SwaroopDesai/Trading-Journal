"use client"
import { useRef, useCallback } from "react"

/**
 * GlowBtn — cursor-tracked radial glow CTA button
 *
 * Props:
 *   children     — button label
 *   onClick      — click handler
 *   disabled     — disabled state
 *   glowColor    — RGB string e.g. "59,130,246"  (default: blue)
 *   showArrow    — show right-arrow icon (default: true)
 *   style        — extra inline styles on the button
 *   ariaLabel    — accessibility label
 */
export default function GlowBtn({
  children,
  onClick,
  disabled,
  glowColor = "59,130,246",
  showArrow = true,
  style = {},
  ariaLabel,
}) {
  const btnRef  = useRef(null)
  const glowRef = useRef(null)
  const arrRef  = useRef(null)

  const onMove = useCallback((e) => {
    const btn = btnRef.current
    if (!btn || disabled) return
    const r  = btn.getBoundingClientRect()
    const x  = e.clientX - r.left
    const y  = e.clientY - r.top
    // Update glow origin
    if (glowRef.current)
      glowRef.current.style.background =
        `radial-gradient(circle at ${x}px ${y}px, rgba(${glowColor},0.22) 0%, transparent 65%)`
    // Magnetic drift
    const dx = (x - r.width  / 2) * 0.12
    const dy = (y - r.height / 2) * 0.12
    btn.style.transform = `translate(${dx}px,${dy}px)`
  }, [glowColor, disabled])

  const onEnter = useCallback(() => {
    if (disabled) return
    if (glowRef.current) glowRef.current.style.opacity = "1"
    if (arrRef.current)  arrRef.current.style.transform  = "translateX(4px)"
  }, [disabled])

  const onLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = "0"
    if (arrRef.current)  arrRef.current.style.transform  = "translateX(0)"
    if (btnRef.current)  btnRef.current.style.transform   = "translate(0,0)"
  }, [])

  const onDown = useCallback(() => {
    if (btnRef.current) btnRef.current.style.transform = "scale(0.95)"
  }, [])

  const onUp = useCallback(() => {
    if (btnRef.current) btnRef.current.style.transform = "translate(0,0)"
  }, [])

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseDown={onDown}
      onMouseUp={onUp}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "transform 0.18s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, box-shadow 0.3s ease",
        ...style,
      }}
    >
      {/* Cursor-tracked glow layer */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 0.35s ease",
          background: `radial-gradient(circle at 50% 50%, rgba(${glowColor},0.22) 0%, transparent 65%)`,
          zIndex: 0,
        }}
      />

      {/* Label */}
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>

      {/* Right-arrow SVG */}
      {showArrow && (
        <svg
          ref={arrRef}
          width="13" height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          aria-hidden="true"
          style={{
            position: "relative",
            zIndex: 1,
            flexShrink: 0,
            transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      )}
    </button>
  )
}
