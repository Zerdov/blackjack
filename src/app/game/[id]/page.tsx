'use client';

import { R } from '@mobily/ts-belt';
import { Hand } from '@/app/classes/Hand';
import { Deck } from '@/app/classes/Deck';
import { useEffect, useState } from 'react';
import { Card } from '@/app/classes/Card';

async function dealing(gameId: number):
  Promise<R.Result<{
    gamblerHand: Hand
    dealerHand: Hand
    deck: Deck
  }, string>> 
{
  try {
    const response = await fetch('/api/phases/dealing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return R.Error(error.message || 'Failed to execute dealing phase.');
    }

    const data = await response.json();
    if (data.gamblerHand && data.dealerHand) {
      return R.Ok({
        gamblerHand: data.gamblerHand,
        dealerHand: data.dealerHand,
        deck: data.deck
      });
    } else {
      return R.Error('Invalid response from server.');
    }
  } catch (error) {
    console.error('Error contacting /api/phases/dealing:', error);
    return R.Error('An error occurred while contacting the server.');
  }
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const [gameId, setGameId] = useState<number | null>(null);
  const [gamblerHand, setGamblerHand] = useState<Hand | null>(null);
  const [dealerHand, setDealerHand] = useState<Hand | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Récupère et décompresse les params
  useEffect(() => {
    params
      .then(({ id }) => setGameId(parseInt(id, 10)))
      .catch(() => setError('Failed to load game parameters.'));
  }, [params]);

  // Appelle `dealing` une fois que gameId est disponible
  useEffect(() => {
    if (gameId !== null) {
      dealing(gameId)
        .then(result => {
          if (R.isOk(result)) {
            const { gamblerHand, dealerHand, deck } = R.getExn(result);
            setGamblerHand(Hand.fromJSON(gamblerHand));
            setDealerHand(Hand.fromJSON(dealerHand));
            setDeck(Deck.fromJSON(deck));
          } else {
            setError(R.getExn(result));
          }
        })
        .catch(err => {
          console.error(err);
          setError('An unexpected error occurred.');
        });
    }
  }, [gameId]);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!gamblerHand || !dealerHand) {
    return <p>Loading...</p>;
  }

  return (
    <section>
      <h1>Game {gameId}</h1>
      <HandDisplay title="Gambler Hand" hand={gamblerHand} />
      <HandDisplay title="Dealer Hand" hand={dealerHand} />
      <Actions />
    </section>
  );
}

function HandDisplay({ title, hand }: { title: string; hand: Hand }) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{hand.cards.map(card => Card.fromJSON(card).toString()).join(', ')}</p>
    </div>
  );
}

function Actions() {
  return (
    <div id="actions">
      <button type="button">Hit</button>
      <button type="button">Stand</button>
      <button type="button">Double Down</button>
      <button type="button">Split</button>
      <button type="button">Surrender</button>
    </div>
  );
}