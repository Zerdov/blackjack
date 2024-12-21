import { A } from "@mobily/ts-belt";
import { Card } from "./Card";

export class Hand {
  id: string;
  cards: Card[];
  bet: number;
  stood: boolean;

  constructor(id: string, bet: number, cards: Card[], stood: boolean) {
    this.id = id;
    this.bet = bet;
    this.cards = cards;
    this.stood = stood;
  }

  // Ajoute une carte à la main
  addCard(card: Card): Hand {
    return new Hand(this.id, this.bet, [...this.cards, card], this.stood);
  }

  // Détermine le score de la main
  calculateScore(): number {
    const { total, aces } = A.reduce(
      this.cards,
      { total: 0, aces: 0 },
        (acc, card) => {
        const value = card.numericValue;

        return {
          total: acc.total + value,
          aces: acc.aces + (card.rank === "Ace" ? 1 : 0),
        };
      }
    );

    const adjustedTotal = total - Math.min(aces, Math.floor((total - 21) / 10)) * 10;

    return adjustedTotal;
  }

  // Renvoie si la main est cramée
  isBusted(): boolean {
    return this.calculateScore() > 21;
  }

  // Renvoie si la main est terminée
  isStanding(): boolean {
    return this.stood;
  }

  // Vérifie si la main est scindable
  isSplitable(): boolean {
    return this.cards.length === 2 && this.cards[0] === this.cards[1] && !this.isStanding();
  }

  // Vérifie si la main est un blackjack
  isBlackjack(): boolean {
    return this.cards.length === 2 && this.calculateScore() === 21;
  }
  
  // Affiche une main
  toString(): string {
    return `Hand: ${this.cards
      .map(card => card.toString())
      .join(", ")} | Bet: ${this.bet} | Score: ${this.calculateScore()}`;
  }

  // Reconstruire l'objet Hand depuis JSON
  static fromJSON(data: any): Hand {    
    return new Hand(data.id, data.bet, data.cards, data.stood);
  }

  // Convertir l'objet Hand en JSON
  toJSON(): object {
    return {
      id: this.id,
      bet: this.bet,
      cards: this.cards,
      stood: this.stood,
    };
  }
}
