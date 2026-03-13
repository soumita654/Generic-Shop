import { useEffect, useRef, useState } from "react";

type Entry = { id: number; text: string };
type Position = { x: number; y: number };

const PANEL_MARGIN = 16;
const POSITION_STORAGE_KEY = "genericshop.voiceover.position.v1";

const movementIntros = [
  "And the cursor surges",
  "Quick footwork from the pointer",
  "A sharp reposition",
  "The crowd sees movement",
  "The play shifts fast",
];

const clickIntros = [
  "Click! Direct contact",
  "Big action taken",
  "Committed move",
  "Decisive tap",
  "Pressure play lands",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function zoneLabel(x: number, y: number): string {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const horizontal = x < w * 0.33 ? "left" : x > w * 0.66 ? "right" : "center";
  const vertical = y < h * 0.33 ? "upper" : y > h * 0.66 ? "lower" : "midfield";
  return `${vertical} ${horizontal}`;
}

function directionLabel(dx: number, dy: number): string {
  const horizontal = dx > 8 ? "right" : dx < -8 ? "left" : "";
  const vertical = dy > 8 ? "down" : dy < -8 ? "up" : "";
  if (horizontal && vertical) return `${vertical}-${horizontal}`;
  return horizontal || vertical || "steady";
}

function targetLabel(target: EventTarget | null): string {
  if (!(target instanceof HTMLElement)) return "screen";

  const aria = target.getAttribute("aria-label");
  if (aria && aria.trim()) return aria.trim();

  const text = target.textContent?.trim().replace(/\s+/g, " ");
  if (text) return text.slice(0, 40);

  const role = target.getAttribute("role");
  if (role) return role;

  if (target.id) return `#${target.id}`;
  return target.tagName.toLowerCase();
}

function clampPosition(pos: Position, width: number, height: number): Position {
  const maxX = Math.max(PANEL_MARGIN, window.innerWidth - width - PANEL_MARGIN);
  const maxY = Math.max(PANEL_MARGIN, window.innerHeight - height - PANEL_MARGIN);

  return {
    x: Math.min(Math.max(PANEL_MARGIN, pos.x), maxX),
    y: Math.min(Math.max(PANEL_MARGIN, pos.y), maxY),
  };
}

function defaultPosition(width: number, height: number): Position {
  return clampPosition(
    {
      x: window.innerWidth - width - PANEL_MARGIN,
      y: 112,
    },
    width,
    height,
  );
}

function readSavedPosition(): Position | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(POSITION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Position>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return null;
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
}

export function LiveCommentaryPanel() {
  const [entries, setEntries] = useState<Entry[]>([
    { id: 1, text: "Commentary live: waiting for the first move..." },
  ]);
  const [position, setPosition] = useState<Position>({ x: 0, y: 112 });
  const [dragging, setDragging] = useState(false);

  const panelRef = useRef<HTMLElement | null>(null);
  const seq = useRef(2);
  const lastMoveAt = useRef(0);
  const lastClickAt = useRef(0);
  const lastPos = useRef({ x: 0, y: 0, t: 0 });
  const latestPositionRef = useRef<Position>({ x: 0, y: 112 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  const pushEntry = (text: string) => {
    setEntries((prev) => [{ id: seq.current++, text }, ...prev].slice(0, 6));
  };

  useEffect(() => {
    const width = panelRef.current?.offsetWidth ?? 320;
    const height = panelRef.current?.offsetHeight ?? 260;
    const saved = readSavedPosition();
    const next = saved ? clampPosition(saved, width, height) : defaultPosition(width, height);
    setPosition(next);
    latestPositionRef.current = next;

    if (saved) {
      window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(next));
    }

    const onResize = () => {
      const panelWidth = panelRef.current?.offsetWidth ?? 320;
      const panelHeight = panelRef.current?.offsetHeight ?? 260;
      setPosition((prev) => {
        const nextPos = clampPosition(prev, panelWidth, panelHeight);
        latestPositionRef.current = nextPos;
        return nextPos;
      });
    };

    lastPos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2, t: performance.now() };

    const onMove = (event: MouseEvent) => {
      const now = performance.now();
      if (now - lastMoveAt.current < 650) return;

      const dx = event.clientX - lastPos.current.x;
      const dy = event.clientY - lastPos.current.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 30) return;

      const dt = Math.max(16, now - lastPos.current.t);
      const speed = dist / dt;
      const tempo = speed > 1.2 ? "at high speed" : speed > 0.65 ? "with intent" : "calmly";
      const zone = zoneLabel(event.clientX, event.clientY);
      const direction = directionLabel(dx, dy);

      pushEntry(`${pick(movementIntros)} ${direction} into the ${zone}, ${tempo}.`);

      lastMoveAt.current = now;
      lastPos.current = { x: event.clientX, y: event.clientY, t: now };
    };

    const onClick = (event: MouseEvent) => {
      const now = performance.now();
      if (now - lastClickAt.current < 220) return;
      lastClickAt.current = now;

      const zone = zoneLabel(event.clientX, event.clientY);
      const target = targetLabel(event.target);
      pushEntry(`${pick(clickIntros)} Target: ${target} in the ${zone}.`);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (dragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [dragging]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!(event.currentTarget instanceof HTMLElement)) return;

    const panel = panelRef.current;
    if (!panel) return;

    draggingRef.current = true;
    setDragging(true);
    dragOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;

    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? 320;
    const height = panel?.offsetHeight ?? 260;

    const next = clampPosition(
      {
        x: event.clientX - dragOffset.current.x,
        y: event.clientY - dragOffset.current.y,
      },
      width,
      height,
    );

    latestPositionRef.current = next;
    setPosition(next);
  };

  const stopDragging = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);

    window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(latestPositionRef.current));
  };

  return (
    <aside
      ref={panelRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-40 hidden w-80 cursor-grab rounded-2xl border border-border/70 bg-card/85 p-3 shadow-2xl backdrop-blur-md transition-colors duration-300 active:cursor-grabbing md:block"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Audio-less Voiceover</h3>
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {dragging ? "Dragging" : "Live"}
        </span>
      </div>
      <div className="space-y-1.5">
        {entries.map((entry) => (
          <p key={entry.id} className="rounded-lg bg-background/70 px-2.5 py-2 text-xs leading-5 text-foreground/90">
            {entry.text}
          </p>
        ))}
      </div>
    </aside>
  );
}