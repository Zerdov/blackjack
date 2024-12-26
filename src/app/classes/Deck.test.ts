import { Deck } from "./Deck";
import { Card } from "./Card";
import { describe, it, expect } from "@jest/globals";

describe("Deck", () => {
  it("should create a new deck", () => {
    const deck = new Deck([]).create();
    expect(deck.cards.length).toBe(312); // 52 cards * 6 decks
  });

  it("should shuffle the deck", () => {
    const deck = new Deck([]).create();
    const shuffledDeck = deck.shuffle();
    expect(shuffledDeck.cards).not.toEqual(deck.cards);
  });

  it("should draw a card from the deck", () => {
    const card = new Card("Ace", "Spades");
    const deck = new Deck([card]);
    const result = deck.drawCard();
    expect(result._0.card).toEqual(card);
    expect(result._0.deck.cards.length).toBe(0);
  });

  it("should convert deck to JSON and back", () => {
    const deck = new Deck([new Card("Ace", "Spades")]);
    const json = deck.toJSON();
    const newDeck = Deck.fromJSON(json);
    expect(newDeck).toEqual(deck);
  });
});
