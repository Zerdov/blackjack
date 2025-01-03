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

  // Tir une carte du paquet
  hit(hand: Hand, deck: Deck): R.Result<{ hand: Hand, deck: Deck }, { hand: Hand, deck: Deck } > {
    return matchR(
      deck.drawCard(),
      {
        Ok: (data) => R.Ok({ hand: hand.addCard(data.card), deck: data.deck }),
        Err: (data) => R.Error({ hand: hand, deck: data.deck })
      }
    );
  }

  stand(hand: Hand): Hand {
    return new Hand(hand.id, hand.bet, hand.cards, "Standing");
  }

  toString(): string {
    return `Dealer | Hands: ${this.hands
      .map(hand => hand.toString())
      .join(", ")}`;
  }

  static fromJSON(data: any): Dealer {
    return new Dealer(data.hands.map((hand: any) => Hand.fromJSON(hand)));
  }

  toJSON(): object {
    return {
      hands: this.hands.map((hand) => hand.toJSON()),
    };
  }
}
