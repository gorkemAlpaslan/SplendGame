import type { Metadata } from "next";
import { Suspense } from "react";
import GamesBrowser from "@/components/GamesBrowser";

export const metadata: Metadata = {
  title: "Oyunlar",
  description: "20 tek kişilik ve 10 çok oyunculu bulmaca oyunu.",
};

export default function GamesPage() {
  return (
    <Suspense>
      <GamesBrowser />
    </Suspense>
  );
}
