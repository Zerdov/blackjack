import { GamesConnector } from '@/app/classes/connectors/GamesConnector';
import { GamblersConnector } from '@/app/classes/connectors/GamblersConnector';
import { A, O, pipe, R } from '@mobily/ts-belt';
import { NextRequest, NextResponse } from 'next/server';
import { Hand } from '@/app/classes/Hand';
import { Gambler } from '@/app/classes/Gambler';
import { Deck } from '@/app/classes/Deck';

export async function POST(req: NextRequest) {

  function updateHandInHands(hands: Hand[], updatedHand: Hand) {
    return hands.map(hand => (hand.id === updatedHand.id ? updatedHand : Hand.fromJSON(hand)));
  }

  function findCurrentHand(hands: Hand[]) {
    return pipe(
      A.find(hands, (hand) => hand.isActive()),
      O.toNullable
    )
  }
  
  try {
    const body = await req.json();
    const { gameId, action, handId } = body;

    // Vérification des paramètres reçus
    if (!gameId || !action || !handId) {
      return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 });
    }

    // Récupérer la partie depuis le connecteur
    const gameConnector = new GamesConnector();
    const gameResult = gameConnector.findGameById(gameId);

    if (R.isError(gameResult)) {
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }

    // Récupérer le joueur depuis le connecteur
    const gamblerConnector = new GamblersConnector();
    const gamblerResult = gamblerConnector.findGamblerById(1); // Remplacez 1 par l'ID réel si nécessaire

    if (R.isError(gamblerResult)) {
      return NextResponse.json({ message: 'Gambler not found.' }, { status: 404 });
    }

    const game = R.getExn(gameResult);
    const gambler = new Gambler(
      R.getExn(gamblerResult).id,
      R.getExn(gamblerResult).name,
      R.getExn(gamblerResult).tokens,
      game.data.gamblerData.hands
    );
    const hand = Hand.fromJSON(game.data.gamblerData.hands.find((h) => h.id === handId));
    const deck = Deck.fromJSON(game.data.deck);

    if (!hand) {
      return NextResponse.json({ message: 'Hand not found for gambler.' }, { status: 404 });
    }

    // Gérer les différentes actions du joueur
    switch (action) {
      case 'hit': {
        const hitResult = gambler.hit(hand, deck);
        if (R.isError(hitResult)) {
          return NextResponse.json({ message: 'Error when trying to hit.' }, { status: 500 });
        }

        const { hand: handAfterHit, deck: deckAfterHit } = R.getExn(hitResult);
        const updatedHandsAfterHit = updateHandInHands(game.data.gamblerData.hands, handAfterHit.isBusted() ? new Hand(handAfterHit.id, handAfterHit.bet, handAfterHit.cards, "Busted") : handAfterHit);

        // Mettre à jour le jeu après l'action
        const updateResultAfterHit = gameConnector.updateGameById(gameId, {
          deck: deckAfterHit,
          gamblerData: {
            id: gambler.id,
            hands: updatedHandsAfterHit,
          },
        });

        if (R.isError(updateResultAfterHit)) {
          return NextResponse.json({ message: 'Failed to update the game after hit.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Hit successful.', hands: updatedHandsAfterHit.map(hand => hand.toJSON()), current: findCurrentHand(updatedHandsAfterHit)?.id, deck: deckAfterHit.toJSON() }, { status: 200 });
      }

      case 'stand': {
        const handAfterStand = gambler.stand(hand);

        const updatedHandsAfterStand = updateHandInHands(game.data.gamblerData.hands, handAfterStand);

        // Mettre à jour le jeu après l'action
        const updateResultAfterStand = gameConnector.updateGameById(gameId, {
          gamblerData: {
            id: gambler.id,
            hands: updatedHandsAfterStand,
          },
        });

        if (R.isError(updateResultAfterStand)) {
          return NextResponse.json({ message: 'Failed to update the game after hit.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Stand successful.', hands: updatedHandsAfterStand.map(hand => hand.toJSON()), current: findCurrentHand(updatedHandsAfterStand)?.id, deck: deck.toJSON() }, { status: 200 });
      }

      case 'doubleDown': {
        const doubleDownResult = gambler.doubleDown(hand, deck);
        if (R.isError(doubleDownResult)) {
          return NextResponse.json({ message: 'Error when trying to double down.' + doubleDownResult._0.message, hands: gambler.hands, current: hand.id, deck: deck }, { status: 200 });
        }

        const { gambler: gamblerAfterDoubleDown, hand: handAfterDoubleDown, deck: deckAfterDoubleDown } = R.getExn(doubleDownResult);
        const updatedHandsAfterDoubleDown = updateHandInHands(game.data.gamblerData.hands, handAfterDoubleDown);

        // Mettre à jour le jeu après l'action
        const updateResultAfterDoubleDown = gameConnector.updateGameById(gameId, {
          deck: deckAfterDoubleDown,
          gamblerData: {
            id: gambler.id,
            hands: updatedHandsAfterDoubleDown,
          },
        });

        if (R.isError(updateResultAfterDoubleDown)) {
          return NextResponse.json({ message: 'Failed to update the game after double down.' }, { status: 500 });
        }

        const updateGamblerAfterDoubleDown = gamblerConnector.updateGamblerTokensById(1, handAfterDoubleDown.bet);

        if (R.isError(updateGamblerAfterDoubleDown)) {
          return NextResponse.json({ message: 'Failed to update the gambler after double down.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Double Down successful.', hands: updatedHandsAfterDoubleDown.map(hand => hand.toJSON()), current: findCurrentHand(updatedHandsAfterDoubleDown)?.id, deck: deckAfterDoubleDown.toJSON() }, { status: 200 });
      }

      case 'split': {
        const splitResult = gambler.split(hand, deck);
        if (R.isError(splitResult)) {
          return NextResponse.json({ message: 'Error when trying to split.' }, { status: 500 });
        }

        const { hands: [hand1AfterSplit, hand2AfterSplit], deck: deckAfterSplit } = R.getExn(splitResult);
        const updatedHandsAfterSplit = [...game.data.gamblerData.hands.filter(h => h.id !== hand.id), hand1AfterSplit, hand2AfterSplit];

        // Mettre à jour le jeu après l'action
        const updateResultAfterSplit = gameConnector.updateGameById(gameId, {
          deck: deckAfterSplit,
          gamblerData: {
            id: gambler.id,
            hands: updatedHandsAfterSplit,
          },
        });

        if (R.isError(updateResultAfterSplit)) {
          return NextResponse.json({ message: 'Failed to update the game after double down.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Split successful.', hands: updatedHandsAfterSplit.map(hand => hand.toJSON()), current: hand1AfterSplit.id,  deck: deckAfterSplit.toJSON() }, { status: 200 });
      }

      case 'surrender': {
        const { hand: handAfterSurrender, gambler: gamblerAfterSurrender } = gambler.surrender(hand);
        const updatedHandsAfterSurrender = updateHandInHands(game.data.gamblerData.hands, handAfterSurrender);

        // Mettre à jour le jeu après l'action
        const updateResultAfterSurrender = gameConnector.updateGameById(gameId, {
          gamblerData: {
            id: gambler.id,
            hands: updatedHandsAfterSurrender,
          },
        });

        if (R.isError(updateResultAfterSurrender)) {
          return NextResponse.json({ message: 'Failed to update the game after surrender.' }, { status: 500 });
        }

        const updateGamblerAfterSurrender = gamblerConnector.updateGamblerTokensById(1, handAfterSurrender.bet);

        if (R.isError(updateGamblerAfterSurrender)) {
          return NextResponse.json({ message: 'Failed to update the gambler after surrender.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Surrender successful.', hands: updatedHandsAfterSurrender.map(hand => hand.toJSON()), current: findCurrentHand(updatedHandsAfterSurrender)?.id, deck: deck.toJSON() }, { status: 200 });
      }

      default:
        return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error during player action phase:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
