import { Hand } from "./Hand";
import { Card } from "./Card";
import { describe, it, expect } from "@jest/globals";

describe("Hand", () => {
  const card1 = new Card("Ace", "Spades");
  const card2 = new Card("10", "Hearts");
  const card3 = new Card("9", "Hearts");

  it("should add a card to the hand", () => {
    const hand = new Hand("1", 100, [card1], false);
    const newHand = hand.addCard(card2);
    expect(newHand.cards.length).toBe(2);
  });

  it("should calculate the score of the hand", () => {
    const hand = new Hand("1", 100, [card1, card2], false);
    expect(hand.calculateScore()).toBe(21);
  });

  it("should return true if the hand is busted", () => {
    const hand = new Hand("1", 100, [card1, card2, card3], false);
    expect(hand.isBusted()).toBe(true);
  });

  it("should return true if the hand is standing", () => {
    const hand = new Hand("1", 100, [card1, card2], true);
    expect(hand.isStanding()).toBe(true);
  });

  it("should return true if the hand is splitable", () => {
    const hand = new Hand("1", 100, [card2, card2], false);
    expect(hand.isSplitable()).toBe(true);
  });

  it("should return true if the hand is a blackjack", () => {
    const hand = new Hand("1", 100, [card1, card2], false);
    expect(hand.isBlackjack()).toBe(true);
  });

  it("should convert hand to JSON and back", () => {
    const hand = new Hand("1", 100, [card1, card2], false);
    const json = hand.toJSON();
    const newHand = Hand.fromJSON(json);
    expect(newHand).toEqual(hand);
  });
});
