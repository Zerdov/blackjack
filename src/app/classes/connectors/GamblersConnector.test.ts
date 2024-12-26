import { GamblersConnector } from "./GamblersConnector";
import { Gambler } from "../Gambler";
import { Hand } from "../Hand";
import { Card } from "../Card";
import { describe, it, expect } from "@jest/globals";

/*describe("GamblersConnector", () => {
  const connector = new GamblersConnector();
  const card1 = new Card("Ace", "Spades");
  const card2 = new Card("10", "Hearts");
  const hand = new Hand("1", 100, [card1, card2], false);
  const gambler = new Gambler(1, "John Doe", 1000, [hand]);

  it("should find a gambler by ID", () => {
    const result = connector.findGamblerById(1);
    expect(result).toEqual(gambler);
  });

  it("should update gambler tokens by ID", () => {
    const result = connector.updateGamblerTokensById(1, 100);
    if (typeof result._0 !== "string") {
      expect(result._0.tokens).toBe(900);
    } else {
      throw new Error("Expected a Gambler object");
    }
  });
});*/
