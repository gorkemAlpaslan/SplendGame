import { Dices } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-edge/15 mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted">
        <div className="flex items-center gap-2">
          <Dices className="w-4 h-4 text-primary-soft" />
          <p>
            <span className="font-bold text-ink">Splend Game</span> — 30 bulmaca oyunu, tek adres.
          </p>
        </div>
        <p className="text-xs">Eğlenceyle yapıldı · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
