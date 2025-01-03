import { N, O, R, Option, Result, pipe } from "@mobily/ts-belt";
import { Hand } from "./Hand";
import { Deck } from "./Deck";
import { Card } from "./Card";
import { matchR } from "@/utils/match";

export class Gambler {
  id: number;
  name: string;
  tokens: number;
  hands: Hand[];

  constructor(id: number, name: string, tokens: number, hands: Hand[]) {
    this.id = id;
    this.name = name;
    this.hands = hands;
    this.tokens = tokens;
  }

  // Ajoute une main
  addHand(hand: Hand): Gambler {
    return new Gambler(this.id, this.name, this.tokens, [hand, ...this.hands]);
  }

  // Vérifier si un double down est possible
  canDoubleDown(hand: Hand): boolean {
    return hand.cards.length === 2 && this.tokens >= hand.bet * 2;
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

  // Met la main comme terminée
  stand(hand: Hand): Hand {
    return new Hand(hand.id, hand.bet, hand.cards, "Standing");
  }

  // Scinde une main en deux, à revoir
  split(hand: Hand, deck: Deck): R.Result<{ hands: [Hand, Hand], deck: Deck }, { message: string, hand: Hand, deck: Deck }> {
    // Vérification explicite que la main est splittable
    if (!hand.isSplitable()) {
      return R.Error({ message: "Hand is not splitable", hand: hand, deck: deck });
    }
  
    // Déstructuration sûre après la vérification explicite
    const [firstCard, secondCard] = hand.cards;
  
    // Création des deux nouvelles mains
    const newHand1 = new Hand(crypto.randomUUID(), hand.bet, [firstCard as Card], "Active");
    const newHand2 = new Hand(crypto.randomUUID(), hand.bet, [secondCard as Card], "Active");
  
    // Tirer une carte pour chaque nouvelle main
    const hitResult1 = this.hit(newHand1, deck);
    if (R.isError(hitResult1)) {
      return R.Error({ message: "failed to hit for the first Hand", hand: hand, deck: deck });
    }

    const { hand: updatedHand1, deck: deckAfterHit1 } = R.getExn(hitResult1);
    const hitResult2 = this.hit(newHand2, deckAfterHit1);

    if (R.isError(hitResult2)) {
      return R.Error({ message: "failed to hit for the second Hand", hand: hand, deck: deck });
    }
  
    // Extraire les mains et le deck mis à jour des résultats
    const { hand: updatedHand2, deck: updatedDeck } = R.getExn(hitResult2);
      
    // Retourner les deux mains et le deck
    return R.Ok({ hands: [updatedHand1, updatedHand2], deck: updatedDeck });
  }

  // Doubler la mise (Double Down)
  doubleDown(hand: Hand, deck: Deck): Result<{ message: "Double Down", gambler: Gambler, hand: Hand, deck: Deck }, { message: "Cannot Double Down", gambler: Gambler, hand: Hand, deck: Deck }> {
    if (!this.canDoubleDown(hand)) {
      return R.Error({ message: "Cannot Double Down", gambler: this, hand: hand, deck: deck });
    }

    const newGambler = new Gambler(
      this.id, 
      this.name, 
      N.subtract(this.tokens, hand.bet),
      this.hands
    );

    const newHand = new Hand(hand.id, hand.bet * 2, hand.cards, "Standing");

    const hitResult = this.hit(newHand, deck);
    if (R.isOk(hitResult)) {
      return R.Ok({ message: "Double Down", gambler: newGambler, hand: R.getExn(hitResult).hand, deck: R.getExn(hitResult).deck }); 
    }

    return R.Error({ message: "Cannot Double Down", gambler: this, hand: hand, deck: deck });
  }

  // Abandonner une main (Surrender)
  surrender(hand: Hand): { gambler : Gambler, hand: Hand } {
    const newHand = new Hand(hand.id, hand.bet, hand.cards, "Surrendered");
    const newGambler = new Gambler(this.id, this.name, N.add(this.tokens, N.divide(hand.bet, 2)), this.hands);
    return { gambler: newGambler, hand: newHand };
  }

  // Placer une mise
  placeBet(amount: number, hand: Hand): Result<{ message: "Place Bet", gambler: Gambler, hand: Hand }, { message: "Cannot Place Bet", gambler: Gambler, hand: Hand }> {
    if (amount <= this.tokens) {
      const newHand = new Hand(hand.id, amount, hand.cards, hand.status);
      const newGambler = new Gambler(
        this.id,
        this.name,
        N.subtract(this.tokens, amount),
        this.hands
      );

      return R.Ok({ message: "Place Bet", gambler: newGambler, hand: newHand });
    }
    
    return R.Error({ message: "Cannot Place Bet", gambler: this, hand: hand });
  };
  
  // Affichage du joueur
  toString(gambler: Gambler): string {
    return `${gambler.name} | Tokens: ${gambler.tokens} | Hands: ${gambler.hands
      .map(hand => hand.toString())
      .join(", ")}`;
  }

  static fromJSON(data: any): Gambler {
    return new Gambler(
      data.id,
      data.name,
      data.tokens,
      data.hands.map((hand: any) => Hand.fromJSON(hand))
    );
  }

  toJSON(): object {
    return {
      id: this.id,
      hands: this.hands.map((hand) => hand.toJSON()),
    };
  }
}
