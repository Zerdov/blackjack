import { Card } from "./Card";
import { describe, it, expect } from "@jest/globals";

describe("Card", () => {
  it("should return the correct numeric value for face cards", () => {
    const card = new Card("Jack", "Spades");
    expect(card.getNumericValue()).toBe(10);
  });

  it("should return the correct numeric value for number cards", () => {
    const card = new Card("7", "Hearts");
    expect(card.getNumericValue()).toBe(7);
  });

  it("should return the correct numeric value for Ace", () => {
    const card = new Card("Ace", "Diamonds");
    expect(card.getNumericValue()).toBe(11);
  });

  it("should convert card to JSON and back", () => {
    const card = new Card("Ace", "Spades");
    const json = card.toJSON();
    const newCard = Card.fromJSON(json);
    expect(newCard).toEqual(card);
  });
});