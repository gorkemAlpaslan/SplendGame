import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GAMES, GAME_MAP } from "@/games/registry";
import GameHost from "@/components/GameHost";

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = GAME_MAP[slug];
  if (!game) return {};
  return { title: game.name, description: game.short };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!GAME_MAP[slug]) notFound();
  return <GameHost slug={slug} />;
}
