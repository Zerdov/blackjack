import { GamblersConnector } from "./GamblersConnector";
import { Gambler } from "../Gambler";
import { Hand } from "../Hand";
import { Card } from "../Card";
import { describe, it, expect } from "@jest/globals";

describe("GamblersConnector", () => {
  const connector = new GamblersConnector();
  const card1 = new Card("Ace", "Spades");
  const card2 = new Card("10", "Hearts");
  const hand = new Hand("1", 100, [card1, card2], 'Active');
  const gambler = new Gambler(2, "John Doe", 1000, [hand]);

  it("should find a gambler by ID", () => {
    const result = connector.findGamblerById(1);
    expect(result).toEqual(gambler);
  });

  it("should update gambler tokens by ID", () => {
    const gambler = connector.findGamblerById(1)._0;
    let tokenHisto = 0;
    if (typeof gambler !== "string") {
      tokenHisto = gambler.tokens;
    }
    const result = connector.updateGamblerTokensById(1, 100);
    if (typeof result._0 !== "string") {
      expect(result._0.tokens).toBe(tokenHisto - 100);
    } else {
      expect(result._0).toBe("Insufficient tokens for gambler ID 1.");
    }
  });
});
