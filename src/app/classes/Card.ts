import { CardRank } from "../types/CardRank";
import { CardSuit } from "../types/CardSuit";

export class Card {
	rank: CardRank;
	suit: CardSuit;
	numericValue: number;

	constructor(rank: CardRank, suit: CardSuit) {
		this.rank = rank;
		this.suit = suit;
		this.numericValue = this.getNumericValue();
	}

	// Permet d'avoir la valeur d'une carte
	getNumericValue(): number {
		const rankValues: { [key: string]: number } = {
			"Jack": 10,
			"Queen": 10,
			"King": 10,
			"Ace": 11,
		};

		return rankValues[this.rank] ?? parseInt(this.rank); 
	}

	// Affiche une carte
	toString(): string{
		return `${this.rank} of ${this.suit}`;
	}

	static fromJSON(data: any): Card {
    return new Card(data.suit, data.rank);
  }

  toJSON(): object {
    return {
      suit: this.suit,
      rank: this.rank,
    };
  }
}
