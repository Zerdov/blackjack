'use client';

import { R } from '@mobily/ts-belt';
import { Hand } from '@/app/classes/Hand';
import { Deck } from '@/app/classes/Deck';
import { useEffect, useState } from 'react';
import { Card } from '@/app/classes/Card';

async function dealing(gameId: number):
  Promise<R.Result<{
    gamblerHand: Hand;
    dealerHand: Hand;
    deck: Deck;
  }, string>> {
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
        deck: data.deck,
      });
    } else {
      return R.Error('Invalid response from server.');
    }
  } catch (error) {
    console.error('Error contacting /api/phases/dealing:', error);
    return R.Error('An error occurred while contacting the server.');
  }
}

async function performActionOnHand(gameId: number, handId: string, action: string): Promise<any> {
  try {
    const response = await fetch('/api/phases/actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId,
        handId,
        action,
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'An error occurred while processing the action.');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error while performing action on hand:', error);
    throw error;
  }
}

async function performDealerTurn(gameId: number): Promise<R.Result<{ message: string; hand: any; deck: any }, { message: string }>> {
  try {
    const response = await fetch('/api/phases/dealer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return R.Error({ message: errorData.message || 'Unknown error occurred.' });
    }

    const data = await response.json();
    return R.Ok({
      message: data.message,
      hand: data.hand,
      deck: data.deck,
    });
  } catch (error) {
    console.error('Error during fetch:', error);
    return R.Error({ message: 'Failed to reach the server.' });
  }
}

async function calculatePayout(gameId: number): Promise<
  R.Result<
    { totalPayout: number; updatedTokens: number; message: string },
    string
  >
> {
  try {
    const response = await fetch("/api/phases/payout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return R.Error(errorData.message || "Failed to calculate payout.");
    }

    const data = await response.json();
    return R.Ok({
      totalPayout: data.totalPayout,
      updatedTokens: data.updatedTokens,
      message: data.message,
    });
  } catch (error) {
    console.error("Error during payout calculation:", error);
    return R.Error("An error occurred while contacting the server.");
  }
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const [gameId, setGameId] = useState<number | null>(null);
  const [hands, setHands] = useState<Hand[]>([]);
  const [dealerHand, setDealerHand] = useState<Hand | null>(null);
  const [currentHandId, setCurrentHandId] = useState<string | null>(null);
  const [payoutResult, setPayoutResult] = useState<{
    totalPayout: number | null;
    updatedTokens: number | null;
    message: string | null;
  }>({ totalPayout: null, updatedTokens: null, message: null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params
      .then(({ id }) => setGameId(parseInt(id, 10)))
      .catch(() => setError('Failed to load game parameters.'));
  }, [params]);

  useEffect(() => {
    if (gameId !== null) {
      // Charger les mains
      dealing(gameId)
        .then((result) => {
          if (R.isOk(result)) {
            const { gamblerHand, dealerHand } = R.getExn(result);
            setHands([Hand.fromJSON(gamblerHand)]);
            setDealerHand(Hand.fromJSON(dealerHand));
            setCurrentHandId(gamblerHand.id);
          } else {
            setError(R.getExn(result));
          }
        })
        .catch((err) => {
          console.error(err);
          setError('An unexpected error occurred.');
        });
    }
  }, [gameId]);

  const handleAction = async (action: string) => {
    if (gameId === null || currentHandId === null) {
      setError('Game ID or current hand ID is missing.');
      return;
    }

    try {
      const result = await performActionOnHand(gameId, currentHandId, action);

      setHands(result.hands.map((hand: Hand) => Hand.fromJSON(hand)));

      if (result.current) {
        setCurrentHandId(result.current);
      } else {
        setCurrentHandId(null);
        handleDealerTurn(gameId);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to perform the action.');
    }
  };

  const handleDealerTurn = async (gameId: number) => {
    const result = await performDealerTurn(gameId);

    if (R.isOk(result)) {
      const { hand, deck } = R.getExn(result);

      setDealerHand(Hand.fromJSON(hand));

      // Une fois le tour du dealer terminé, calculer le payout
      const payoutResult = await calculatePayout(gameId);
      if (R.isOk(payoutResult)) {
        const { totalPayout, updatedTokens, message } = R.getExn(payoutResult);
        setPayoutResult({
          totalPayout,
          updatedTokens,
          message,
        });
      } else {
        setError(R.getExn(payoutResult));
      }
    } else {
      const error = R.getExn(result);
      console.error('Dealer turn failed:', error);
      setError('Failed to perform the dealer turn');
    }
  };

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!hands.length || !dealerHand) {
    return <p>Loading...</p>;
  }

  return (
    <section>
      <h1>Game {gameId}</h1>
      <h2>Hand {currentHandId}</h2>
      <div>
        {hands.map((hand) => (
          <HandDisplay
            key={hand.id}
            title={`Gambler Hand ${hand.id}`}
            hand={hand}
            isCurrent={hand.id === currentHandId}
          />
        ))}
        <HandDisplay title="Dealer Hand" hand={dealerHand} />
      </div>
      <Actions onAction={handleAction} />
      {payoutResult.message && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <h3>Payout Result</h3>
          <p>{payoutResult.message}</p>
          <p>Total Payout: {payoutResult.totalPayout}</p>
          <p>Updated Tokens: {payoutResult.updatedTokens}</p>
        </div>
      )}
    </section>
  );
}

function HandDisplay({ title, hand, isCurrent }: { title: string; hand: Hand; isCurrent?: boolean }) {
  return (
    <div style={{ border: isCurrent ? '2px solid green' : '1px solid black', padding: '10px' }}>
      <h2>{title}</h2>
      <p>{hand.cards.map((card) => Card.fromJSON(card).toString()).join(', ')}</p>
      <p>Status: {hand.status}</p>
    </div>
  );
}

function Actions({ onAction }: { onAction: (action: string) => void }) {
  const actions = ['hit', 'doubleDown', 'split', 'surrender', 'stand'];

  return (
    <div className="flex justify-center gap-4 mt-4">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => onAction(action)}
          className="px-4 py-2 text-white font-bold bg-blue-500 rounded hover:bg-blue-700 transition duration-300"
        >
          {action.charAt(0).toUpperCase() + action.slice(1)}
        </button>
      ))}
    </div>
  );
}
