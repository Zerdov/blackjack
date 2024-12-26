import { GamesConnector } from "./GamesConnector";
import { Gambler } from "../Gambler";
import { Hand } from "../Hand";
import { Card } from "../Card";
import { describe, it, expect } from "@jest/globals";

/*describe("GamesConnector", () => {
  const connector = new GamesConnector();
  const card1 = new Card("Ace", "Spades");
  const card2 = new Card("10", "Hearts");
  const hand = new Hand("1", 100, [card1, card2], false);
  const gambler = new Gambler(1, "John Doe", 1000, [hand]);

  it("should add a game", () => {
    const result = connector.addGame(gambler, 100);
    expect(result._0.success).toBe(true);
  });

  it("should find a game by ID", () => {
    const result = connector.findGameById(1);
    expect(result._0.success).toBe(true);
  });

  it("should update a game by ID", () => {
    const updates = { status: "Finished" };
    const result = connector.updateGameById(1, updates);
    expect(result._0.success).toBe(true);
  });
});*/
