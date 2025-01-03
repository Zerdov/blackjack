import { Gambler } from "./Gambler";
import { Hand } from "./Hand";
import { Card } from "./Card";
import { Deck } from "./Deck";
import { describe, it, expect } from "@jest/globals";

describe("Gambler", () => {
  const card1 = new Card("Ace", "Spades");
  const card2 = new Card("10", "Hearts");
  const hand = new Hand("1", 100, [card1, card2], "Active");
  const gambler = new Gambler(1, "John Doe", 1000, [hand]);

  it("should add a hand to the gambler", () => {
    const newHand = new Hand("2", 200, [card1], "Active");
    const newGambler = gambler.addHand(newHand);
    expect(newGambler.hands.length).toBe(2);
  });

  it("should check if double down is possible", () => {
    expect(gambler.canDoubleDown(hand)).toBe(true);
  });

  it("should hit and add a card to the hand", () => {
    const deck = new Deck([card1, card2]);
    const result = gambler.hit(hand, deck);
    expect(result._0.hand.cards.length).toBe(3);
  });

  it("should stand and mark the hand as stood", () => {
    const stoodHand = gambler.stand(hand);
    expect(stoodHand.isStanding()).toBe(true);
  });
});
