import { A } from "@mobily/ts-belt";
import { Card } from "./Card";

export class Hand {
  id: string;
  cards: Card[];
  bet: number;
  status: "Active" | "Standing" | "Busted" | "Surrendered";

  constructor(id: string, bet: number, cards: Card[], status: "Active" | "Standing" | "Busted" | "Surrendered") {
    this.id = id;
    this.bet = bet;
    this.cards = cards;
    this.status = status;
  }

  // Ajoute une carte à la main
  addCard(card: Card): Hand {
    return new Hand(this.id, this.bet, [...this.cards, card], this.status);
  }

  // Détermine le score de la main
  calculateScore(): number {
    let total = 0;
    let aces = 0;
  
    // Parcourir toutes les cartes
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      let value = 0;
  
      // Déterminer la valeur de la carte
      if (card.rank === "Ace") {
        value = 11;
        aces += 1; // On compte un As
      } else if (["Jack", "Queen", "King"].includes(card.rank)) {
        value = 10; // Les figures valent 10
      } else {
        value = parseInt(card.rank, 10); // Les autres cartes sont des numéros
      }
  
      total += value; // Ajouter la valeur de la carte au total
    }
  
    // Ajuster la valeur des As si nécessaire (en cas de dépassement de 21)
    while (total > 21 && aces > 0) {
      total -= 10; // Chaque As est réduit de 11 à 1
      aces -= 1; // On réduit le nombre d'As
    }
  
    return total;
  }

  // Renvoie si la main est active (toujours jouable)
  isActive(): boolean {
    return this.status === "Active";
  }

  // Renvoie si la main est figée
  isStanding(): boolean {
    return this.status === "Standing";
  }

  // Renvoie si la main est cramée
  isBusted(): boolean {
    return this.calculateScore() > 21;
  }
  
  // Renvoie si la main est abandonnée
  isSurrendered(): boolean {
    return this.status === "Surrendered";
  }

  // Vérifie si la main est un blackjack
  isBlackjack(): boolean {
    return this.cards.length === 2 && this.calculateScore() === 21;
  }

  // Vérifie si la main est scindable
  isSplitable(): boolean {
    return this.cards.length === 2 && this.cards[0].rank === this.cards[1].rank && this.isActive();
  }
  
  // Affiche une main
  toString(): string {
    return `Hand: ${this.cards
      .map(card => card.toString())
      .join(", ")} | Bet: ${this.bet} | Score: ${this.calculateScore()}`;
  }

  // Reconstruire l'objet Hand depuis JSON
  static fromJSON(data: any): Hand {    
    return new Hand(data.id, data.bet, data.cards, data.status);
  }

  // Convertir l'objet Hand en JSON
  toJSON(): object {
    return {
      id: this.id,
      bet: this.bet,
      cards: this.cards,
      status: this.status,
    };
  }
}
