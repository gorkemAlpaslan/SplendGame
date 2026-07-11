"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { useInterval } from "@/lib/hooks";
import { cls, randInt } from "@/lib/utils";

const N = 15;
type Dir = "up" | "down" | "left" | "right";
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
const DELTA: Record<Dir, number> = { up: -N, down: N, left: -1, right: 1 };

function randomApple(snake: number[]): number {
  let a = randInt(0, N * N - 1);
  while (snake.includes(a)) a = randInt(0, N * N - 1);
  return a;
}

export default function Snake() {
  const [snake, setSnake] = useState<number[]>([112, 111, 110]); // orta
  const [apple, setApple] = useState<number>(() => randomApple([112, 111, 110]));
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const dirRef = useRef<Dir>("right");
  const queueRef = useRef<Dir[]>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const speed = Math.max(80, 180 - Math.floor(score / 30) * 15);

  const setDir = useCallback((d: Dir) => {
    const last = queueRef.current[queueRef.current.length - 1] ?? dirRef.current;
    if (d !== last && d !== OPPOSITE[last]) queueRef.current.push(d);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      if (map[e.key]) {
        e.preventDefault();
        setDir(map[e.key]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDir]);

  const gameOver = () => {
    setRunning(false);
    setResult({ won: score >= 100, score, message: `${snake.length} boyuna ulaştın!` });
  };

  useInterval(
    () => {
      const next = queueRef.current.shift();
      if (next) dirRef.current = next;
      const dir = dirRef.current;
      const head = snake[0];
      const r = Math.floor(head / N);
      const c = head % N;
      // duvar kontrolü
      if (
        (dir === "up" && r === 0) ||
        (dir === "down" && r === N - 1) ||
        (dir === "left" && c === 0) ||
        (dir === "right" && c === N - 1)
      ) {
        gameOver();
        return;
      }
      const newHead = head + DELTA[dir];
      const body = snake.slice(0, -1);
      if (body.includes(newHead)) {
        gameOver();
        return;
      }
      if (newHead === apple) {
        const grown = [newHead, ...snake];
        setSnake(grown);
        setApple(randomApple(grown));
        setScore((s) => s + 10);
      } else {
        setSnake([newHead, ...body]);
      }
    },
    running && !result ? speed : null
  );



  const restart = useCallback(() => {
    const init = [112, 111, 110];
    setSnake(init);
    setApple(randomApple(init));
    setScore(0);
    setResult(null);
    setRunning(false);
    dirRef.current = "right";
    queueRef.current = [];
  }, []);

  const snakeSet = new Set(snake);

  return (
    <GameShell
      slug="yilan"
      onRestart={restart}
      result={result}
      stats={[
        { label: "Puan", value: score },
        { label: "Boy", value: snake.length },
      ]}
    >
      <div className="max-w-sm mx-auto">
        <div
          className="relative card !rounded-xl overflow-hidden"
          style={{ touchAction: "none" }}
          onTouchStart={(e) => {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            if (!touchStart.current) return;
            const dx = e.changedTouches[0].clientX - touchStart.current.x;
            const dy = e.changedTouches[0].clientY - touchStart.current.y;
            touchStart.current = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
            if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? "right" : "left");
            else setDir(dy > 0 ? "down" : "up");
          }}
        >
          <div className="grid" style={{ gridTemplateColumns: `repeat(${N}, minmax(0,1fr))` }}>
            {Array.from({ length: N * N }, (_, i) => (
              <div
                key={i}
                className={cls(
                  "aspect-square",
                  snake[0] === i
                    ? "bg-emerald-300 rounded"
                    : snakeSet.has(i)
                      ? "bg-emerald-500 rounded-sm"
                      : (Math.floor(i / N) + i) % 2 === 0
                        ? "bg-surface"
                        : "bg-surface-2/50"
                )}
              >
                {apple === i && <span className="flex items-center justify-center text-sm h-full">🍎</span>}
              </div>
            ))}
          </div>
          {!running && !result && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <button onClick={() => setRunning(true)} className="btn-primary text-lg !px-8 !py-3">
                ▶️ Başla
              </button>
            </div>
          )}
        </div>

        {/* mobil yön tuşları */}
        <div className="grid grid-cols-3 gap-2 max-w-44 mx-auto mt-4 sm:hidden">
          <div />
          <button onClick={() => setDir("up")} className="btn-ghost !py-3">⬆️</button>
          <div />
          <button onClick={() => setDir("left")} className="btn-ghost !py-3">⬅️</button>
          <button onClick={() => setDir("down")} className="btn-ghost !py-3">⬇️</button>
          <button onClick={() => setDir("right")} className="btn-ghost !py-3">➡️</button>
        </div>
        <p className="text-center text-muted text-sm mt-3 hidden sm:block">
          ⌨️ Ok tuşları ile yönlendir
        </p>
      </div>
    </GameShell>
  );
}
