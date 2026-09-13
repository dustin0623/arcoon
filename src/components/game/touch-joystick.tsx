import { useCallback, useEffect, useRef, useState } from "react";

const RADIUS = 56;
const KNOB = 44;

function sendMove(x: number, y: number) {
  window.dispatchEvent(new CustomEvent("arena-move", { detail: { x, y } }));
}

/**
 * Archero-style floating joystick.
 * Touch anywhere in the zone to place the stick; drag to steer the player.
 */
export default function TouchJoystick() {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  const reset = useCallback(() => {
    pointerId.current = null;
    setOrigin(null);
    setKnob({ x: 0, y: 0 });
    sendMove(0, 0);
  }, []);

  useEffect(() => () => sendMove(0, 0), []);

  const onDown = (e: React.PointerEvent) => {
    if (pointerId.current !== null) return;
    pointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setOrigin({ x: e.clientX, y: e.clientY });
    setKnob({ x: 0, y: 0 });
  };

  const onMove = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId || !origin) return;
    let dx = e.clientX - origin.x;
    let dy = e.clientY - origin.y;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    sendMove(dx / RADIUS, dy / RADIUS);
  };

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 h-[45%] touch-none select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={reset}
      onPointerCancel={reset}
      onPointerLeave={reset}
    >
      {origin && (
        <>
          <div
            className="absolute rounded-full border-2 border-white/40 bg-black/30"
            style={{
              width: RADIUS * 2,
              height: RADIUS * 2,
              left: origin.x - RADIUS,
              top: origin.y - RADIUS,
            }}
          />
          <div
            className="absolute rounded-full border-2 border-white/70 bg-white/40"
            style={{
              width: KNOB,
              height: KNOB,
              left: origin.x - KNOB / 2 + knob.x,
              top: origin.y - KNOB / 2 + knob.y,
            }}
          />
        </>
      )}
    </div>
  );
}
