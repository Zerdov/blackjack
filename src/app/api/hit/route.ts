import { NextResponse } from 'next/server';
import { Deck } from '@/app/classes/Deck'; // Chemin vers votre modèle Deck
import { Hand } from '@/app/classes/Hand'; // Chemin vers votre modèle Hand
import { R } from '@mobily/ts-belt';

// Fonction pour gérer la requête POST
export async function POST(req: Request) {
  try {
    // Récupérer le body de la requête
    const body = await req.json();
    const { hand, deck } = body;

    // Validation de la présence des données
    if (!hand || !deck) {
      return NextResponse.json(
        { message: 'Hand or deck not provided.' },
        { status: 400 }
      );
    }

    // Réinstancier les objets Hand et Deck
    const currentHand = Hand.fromJSON(hand);
    const currentDeck = Deck.fromJSON(deck);

    // Tirer une carte du deck
    const drawResult = currentDeck.drawCard();
    if (!drawResult) {
      return NextResponse.json(
        { message: 'No cards left in the deck.' },
        { status: 400 }
      );
    }

    const card = R.getExn(drawResult).card;
    const updatedDeck = R.getExn(drawResult).deck;

    // Ajouter la carte à la main
    const updatedHand = currentHand.addCard(card);

    // Retourner les nouvelles données
    return NextResponse.json({
      hand: updatedHand.toJSON(),
      deck: updatedDeck.toJSON(),
    });
  } catch (error) {
    console.error('Error in /api/hit:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing the request.' },
      { status: 500 }
    );
  }
}
