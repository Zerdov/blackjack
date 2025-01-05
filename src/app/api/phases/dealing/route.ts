import { GamesConnector } from "@/app/classes/connectors/GamesConnector";
import { GamblersConnector } from "@/app/classes/connectors/GamblersConnector";
import { Deck } from "@/app/classes/Deck";
import { Hand } from "@/app/classes/Hand";
import { R } from "@mobily/ts-belt";
import { Gambler } from "@/app/classes/Gambler";
import { Dealer } from "@/app/classes/Dealer";
import { Card } from "@/app/classes/Card";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Parse le JSON envoyé dans la requête
    const { gameId } = body;

    // Validation du gameId
    if (!gameId || typeof gameId !== "number" || gameId <= 0) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid gameId provided." }),
        { status: 400 }
      );
    }

    const gameConnector = new GamesConnector();
    const gameResult = gameConnector.findGameById(gameId);

    // Vérification si la partie existe
    if (R.isError(gameResult)) {
      return new NextResponse(
        JSON.stringify({ message: "Game not found." }),
        { status: 404 }
      );
    }

    const gamblerConnector = new GamblersConnector();
    const gamblerResult = gamblerConnector.findGamblerById(1);

    // Vérification si le gambler existe
    if (R.isError(gamblerResult)) {
      return new NextResponse(
        JSON.stringify({ message: "Gambler not found." }),
        { status: 404 }
      );
    }

    // Récupération des données du jeu, gambler, dealer et deck
    const game = R.getExn(gameResult).data;
    const gambler = new Gambler(
      R.getExn(gamblerResult).id,
      R.getExn(gamblerResult).name,
      R.getExn(gamblerResult).tokens,
      game.gamblerData.hands
    );
    const dealer = new Dealer(game.dealer.hands);
    const deck = new Deck(game.deck.cards);

    // Fonction utilitaire pour gérer un hit
    const hit = (player: Gambler | Dealer, hand: Hand, deck: Deck) => {
      const hitResult = player.hit(hand, deck);
      if (R.isError(hitResult)) {
        throw new Error(`Failed to perform a hit for ${player instanceof Gambler ? "gambler" : "dealer"}.`);
      }
      return R.getExn(hitResult);
    };

    // Gestion des hits
    const afterDealerHit = hit(dealer, Hand.fromJSON(dealer.hands[0]), deck);
    const afterGamblerHit1 = hit(gambler, Hand.fromJSON(gambler.hands[0]), afterDealerHit.deck);
    const afterGamblerHit2 = hit(gambler, afterGamblerHit1.hand, afterGamblerHit1.deck);

    // Mise à jour du jeu
    // const updateResult = gameConnector.updateGameById(gameId, {
    //   deck: afterGamblerHit2.deck,
    //   gamblerData: {
    //     id: gambler.id,
    //     hands: [afterGamblerHit2.hand],
    //   },
    //   dealer: new Dealer([afterDealerHit.hand]),
    //   status: "Dealing Done",
    // });

    //afterGamblerHit2.hand.cards = [new Card("2", "Clubs"), new Card("2", "Clubs")]
    afterGamblerHit2.hand.status = "Active";

    const updateResult = gameConnector.updateGameById(gameId, {
      deck: afterGamblerHit2.deck,
      gamblerData: {
        id: gambler.id,
        hands: [afterGamblerHit2.hand],
      },
      dealer: new Dealer([afterDealerHit.hand]),
      status: "Dealing Done",
    });

    if (R.isError(updateResult)) {
      return new NextResponse(
        JSON.stringify({ message: "Failed to update the game." }),
        { status: 500 }
      );
    }

    // Réponse en cas de succès
    return new NextResponse(
      JSON.stringify({
        message: "Dealing Done",
        gamblerHand: afterGamblerHit2.hand.toJSON(),
        dealerHand: afterDealerHit.hand.toJSON(),
        deck: afterGamblerHit2.deck.toJSON(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error during dealing phase:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error." }),
      { status: 500 }
    );
  }
};
