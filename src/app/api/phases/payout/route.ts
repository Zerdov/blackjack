import { GamblersConnector } from "@/app/classes/connectors/GamblersConnector";
import { GamesConnector } from "@/app/classes/connectors/GamesConnector";
import { Dealer } from "@/app/classes/Dealer";
import { Gambler } from "@/app/classes/Gambler";
import { Hand } from "@/app/classes/Hand";
import { R } from "@mobily/ts-belt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId } = body;

    // Validation du gameId
    if (!gameId || typeof gameId !== "number" || gameId <= 0) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid gameId provided." }),
        { status: 400 }
      );
    }

    // Connecteurs
    const gameConnector = new GamesConnector();
    const gamblerConnector = new GamblersConnector();

    // Récupération des données du jeu et du joueur
    const gameResult = gameConnector.findGameById(gameId);
    const gamblerResult = gamblerConnector.findGamblerById(1);

    // Vérifications des erreurs
    if (R.isError(gameResult)) {
      return new NextResponse(
        JSON.stringify({ message: "Game not found." }),
        { status: 404 }
      );
    }
    if (R.isError(gamblerResult)) {
      return new NextResponse(
        JSON.stringify({ message: "Gambler not found." }),
        { status: 404 }
      );
    }

    const game = R.getExn(gameResult).data;
    const gambler = R.getExn(gamblerResult);
    const dealerHand = Dealer.fromJSON(game.dealer).hands[0];
    const gamblerHands = game.gamblerData.hands.map((hand: any) =>
      Hand.fromJSON(hand)
    );

    // Fonction PF pour évaluer les gains par main
    const evaluatePayout = (
      gamblerHand: Hand,
      dealerHand: Hand
    ): number => {
      const gamblerScore = gamblerHand.calculateScore();
      const dealerScore = dealerHand.calculateScore();

      if (gamblerHand.isBusted()) {
        return -gamblerHand.bet; // Perte totale
      }
      if (dealerHand.isBusted() || gamblerScore > dealerScore) {
        return gamblerHand.bet * 2; // Gain doublé
      }
      if (gamblerScore === dealerScore) {
        return gamblerHand.bet; // Récupération de la mise
      }
      return -gamblerHand.bet; // Perte totale
    };

    // Calcul des gains pour chaque main
    const payouts = gamblerHands.map((hand: Hand) =>
      evaluatePayout(hand, dealerHand)
    );

    // Somme des gains
    const totalPayout = payouts.reduce((sum, payout) => sum + payout, 0);

    // Mise à jour des tokens du gambler
    const updatedGambler = new Gambler(
      gambler.id,
      gambler.name,
      gambler.tokens + totalPayout,
      gambler.hands
    );

    // Sauvegarde des changements
    const saveGamblerResult = gamblerConnector.updateGamblerTokensById(
      gambler.id,
      totalPayout
    );
    if (R.isError(saveGamblerResult)) {
      return new NextResponse(
        JSON.stringify({ message: "Failed to save gambler data." }),
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Payout calculated successfully.",
      totalPayout,
      updatedTokens: updatedGambler.tokens,
    });
  } catch (error) {
    console.error("Error during payout phase:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error." }),
      { status: 500 }
    );
  }
}
