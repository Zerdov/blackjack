'use client';

import { R } from '@mobily/ts-belt';
import { Hand } from '@/app/classes/Hand';
import { Deck } from '@/app/classes/Deck';

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

export default function GamePage({ params }: { params: { id: string } }) {
  dealing(1734963635169)
}

function HandDisplay({ title, hand }: { title: string; hand: Hand }) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{hand.cards.map(card => card.toString()).join(', ')}</p>
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
