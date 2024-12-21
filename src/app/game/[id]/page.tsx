import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Game } from '@/app/classes/Game';
import { GamesConnector } from '@/app/classes/connectors/GamesConnector';

export default async function GamePage({ params }: { params: { gameId: string } }) {
  const { gameId } = await params;

  const gamesConnector = new GamesConnector();
  const game = gamesConnector.findGameById(parseInt(gameId));

  if (!game) {
    notFound();
  }

  return(
    <section id="actions">
      <button type="button">Hit</button>
      <button type="button">Stand</button>
      <button type="button">Double Down</button>
      <button type="button">Split</button>
      <button type="button">Surrend</button>
    </section>
  )
}
