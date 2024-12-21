import { Card } from "./Card";
import { CardSuit } from "../types/CardSuit";
import { CardRank } from "../types/CardRank";
import { R, A } from "@mobily/ts-belt";

export class Deck {
  cards: Card[];

  constructor(cards: Card[]) {
    this.cards = cards;
  }

  // Crée un nouveau deck
  create(): Deck {
    const suits: CardSuit[] = ["Hearts", "Diamonds", "Clubs", "Spades"];
    const ranks: CardRank[] = [
      "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"
    ];
    const cards: Card[] = suits.flatMap((suit) =>
      ranks.flatMap((rank) =>
        Array.from({ length: 6 }, () => new Card(rank, suit))
      )
    );
    return new Deck(cards);
  }

  // Retourne un nouveau deck mélangé ou une erreur si le deck est vide
  shuffle(): Deck {
    return new Deck([...A.shuffle(this.cards)]);
  }


  // Tire une carte et retourne une nouvelle instance de Deck sans cette carte et la carte tirée, ou une erreur
  drawCard(): R.Result<{ deck: Deck; card: Card }, { deck: Deck, card: null}> {
    const [card, ...remainingCards] = this.cards;
    return card ? R.Ok({ deck: new Deck(remainingCards), card: card }) : R.Error({ deck: this, card: null});
  }

  // Affiche un deck
  toString(): string {
    return this.cards.map((card) => card.toString()).join("\n");
  }
}
