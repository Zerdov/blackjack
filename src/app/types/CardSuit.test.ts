import { CardSuit } from "./CardSuit";
import { describe, it, expect } from "@jest/globals";
import * as fc from "fast-check";

describe("CardSuit", () => {
  it("should include valid suits", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<CardSuit>("Hearts", "Diamonds", "Clubs", "Spades"),
        (suit) => {
          expect(["Hearts", "Diamonds", "Clubs", "Spades"]).toContain(suit);
        }
      )
    );
  });
});
