import { GamesConnector } from "@/app/classes/connectors/GamesConnector";
import { Dealer } from "@/app/classes/Dealer";
import { Deck } from "@/app/classes/Deck";
import { Hand } from "@/app/classes/Hand";
import { R } from "@mobily/ts-belt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Parse le JSON envoyé dans la requête
    const { gameId } = body;

    // Validation du gameId
    if (!gameId || typeof gameId !== "number" || gameId <= 0) {
      return NextResponse.json(
        { message: "Invalid gameId provided." },
        { status: 400 }
      );
    }

    const gameConnector = new GamesConnector();
    const gameResult = gameConnector.findGameById(gameId);

    // Vérification si la partie existe
    if (R.isError(gameResult)) {
      return NextResponse.json(
        { message: "Game not found." },
        { status: 404 }
      );
    }

    const gameData = R.getExn(gameResult).data;
    const dealer = Dealer.fromJSON(gameData.dealer);
    const deck = Deck.fromJSON(gameData.deck);

    // Vérifier si le dealer a une main valide
    if (!dealer.hands.length) {
      return NextResponse.json(
        { message: "Dealer has no hands." },
        { status: 500 }
      );
    }

    // Fonction récursive pour que le dealer pioche jusqu'à 17
    const hitTill17 = (dealer: Dealer, deck: Deck): R.Result<{ hand: Hand; deck: Deck }, string> => {
      const dealerHand = dealer.hands[0];
      if (dealerHand.calculateScore() >= 17) {
        const finalHand = dealerHand.isBusted()
          ? new Hand(dealerHand.id, dealerHand.bet, dealerHand.cards, "Busted")
          : dealerHand;
        return R.Ok({ hand: finalHand, deck });
      }

      const hitResult = dealer.hit(dealerHand, deck);
      if (R.isError(hitResult)) {
        return R.Error("Error during dealer hit.");
      }

      const { hand: handAfterHit, deck: deckAfterHit } = R.getExn(hitResult);
      return hitTill17(new Dealer([handAfterHit]), deckAfterHit);
    };

    const hitResult = hitTill17(dealer, deck);
    if (R.isError(hitResult)) {
      return NextResponse.json(
        { message: "Error during dealer's turn." },
        { status: 500 }
      );
    }

    const { hand, deck: finalDeck } = R.getExn(hitResult);
   
    // Créer un objet avec les mises à jour nécessaires
    const updatedGameData = {
      dealer: new Dealer([hand]),
      deck: finalDeck,
    };

    // Mettre à jour le jeu dans la base de données
    const updateResult = gameConnector.updateGameById(gameId, updatedGameData);

    // Vérifier si la mise à jour a réussi
    if (R.isError(updateResult)) {
      return NextResponse.json({ message: 'Failed to update the game state.' }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: "Dealer's turn completed successfully.",
        hand: hand.toJSON(),
        deck: finalDeck.toJSON(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during dealer phase:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
