import { Dealer } from "./Dealer";
import { Hand } from "./Hand";
import { Card } from "./Card";
import { Deck } from "./Deck";
import { describe, it, expect } from "@jest/globals";

describe("Dealer", () => {
  const card1 = new Card("Ace", "Spades");
  const card2 = new Card("10", "Hearts");
  const hand = new Hand("1", 100, [card1, card2], "Standing");
  const dealer = new Dealer([hand]);

  it("should add a hand to the dealer", () => {
    const newHand = new Hand("2", 200, [card1], "Standing");
    const newDealer = dealer.addHand(newHand);
    expect(newDealer.hands.length).toBe(2);
  });

  it("should hit and add a card to the hand", () => {
    const deck = new Deck([card1, card2]);
    const result = dealer.hit(hand, deck);
    expect(result._0.hand.cards.length).toBe(3);
  });

  it("should stand and mark the hand as stood", () => {
    const stoodHand = dealer.stand(hand);
    expect(stoodHand.isStanding()).toBe(true);
  });

  it("should convert dealer to JSON and back", () => {
    const json = dealer.toJSON();
    const newDealer = Dealer.fromJSON(json);
    expect(newDealer).toEqual(dealer);
  });
});
