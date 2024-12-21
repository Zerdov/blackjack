import { matchR } from "@/utils/match";
import { Deck } from "./Deck";
import { Hand } from "./Hand";
import { R } from "@mobily/ts-belt";

export class Dealer {
  hands: Hand[];

  constructor(hands: Hand[]) {
    this.hands = hands;
  }

  // Ajoute une main
  addHand(hand: Hand): Dealer {
    return new Dealer([hand, ...this.hands]);
  }

  hit(hand: Hand, deck: Deck): R.Result<{ hand: Hand, deck: Deck }, { hand: Hand, deck: Deck } > {
    return matchR(
      deck.drawCard(),
      {
        Ok: ({ deck, card }) => R.Ok({ hand: hand.addCard(card), deck: deck }),
        Err: (data) => R.Error({ hand: hand, deck: data.deck })
      }
    )
  }

  stand(hand: Hand): Hand {
    return new Hand(hand.id, hand.bet, hand.cards, true);
  }

  toString(): string {
    return `Dealer | Hands: ${this.hands
      .map(hand => hand.toString())
      .join(", ")}`;
  }
}
