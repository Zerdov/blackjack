import { N, O, R, Option, Result, pipe } from "@mobily/ts-belt";
import { Hand } from "./Hand";
import { Deck } from "./Deck";
import { Card } from "./Card";
import { matchR } from "@/utils/match";
import { GamblersConnector } from "./connectors/GamblersConnector";

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
    return new Hand(hand.id, hand.bet, hand.cards, true);
  }

  // Scinde une main en deux, à revoir
  split(hand: Hand, deck: Deck): R.Result<{ hands: [Hand, Hand], deck: Deck }, { hand: Hand, deck: Deck }> {
    // Vérification explicite que la main est splittable
    if (!hand.isSplitable()) {
      return R.Error({ hand: hand, deck: deck });
    }
  
    // Déstructuration sûre après la vérification explicite
    const [firstCard, secondCard] = hand.cards;
  
    // Création des deux nouvelles mains
    const newHand1 = new Hand(crypto.randomUUID(), hand.bet, [firstCard as Card], false);
    const newHand2 = new Hand(crypto.randomUUID(), hand.bet, [secondCard as Card], false);
  
    // Tirer une carte pour chaque nouvelle main
    const hitResult1 = this.hit(newHand1, deck);
    const hitResult2 = this.hit(newHand2, deck);
  
    // Vérification des résultats du hit
    if (R.isError(hitResult1) || R.isError(hitResult2)) {
      return R.Error({ hand: hand, deck: deck });
    }
  
    // Extraire les mains et le deck mis à jour des résultats
    const updatedHand1 = hitResult1._0.hand;
    const updatedHand2 = hitResult2._0.hand;
    const updatedDeck = hitResult2._0.deck;
  
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
      this.tokens - hand.bet,
      this.hands
    );

    const newHand = new Hand(hand.id, hand.bet * 2, hand.cards, hand.stood);

    const hitR = this.hit(newHand, deck);
    if (R.isOk(hitR)) {
      return R.Ok({ message: "Double Down", gambler: newGambler, hand: newHand, deck: R.getExn(hitR).deck }); 
    }

    return R.Error({ message: "Cannot Double Down", gambler: this, hand: hand, deck: deck });
  }

  // Abandonner une main (Surrender)
  surrender(hand: Hand): { gambler : Gambler, hand: Hand } {
    const newHand = new Hand(hand.id, N.divide(hand.bet, 2), hand.cards, true);
    const newGambler = new Gambler(this.id, this.name, N.add(this.tokens, N.divide(hand.bet, 2)), this.hands);
    return { gambler: newGambler, hand: newHand };
  }

  // Placer une mise
  placeBet(amount: number, hand: Hand): Result<{ message: "Place Bet", gambler: Gambler, hand: Hand }, { message: "Cannot Place Bet", gambler: Gambler, hand: Hand }> {
    if (amount <= this.tokens) {
      const newHand = new Hand(hand.id, amount, hand.cards, hand.stood);
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
    const connector = new GamblersConnector();
    const gambler = R.getExn(connector.findGamblerById(data.id));
    return new Gambler(
      data.id,
      gambler.name,
      gambler.tokens,
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
