import { CardRank } from "./CardRank";
import { describe, it, expect } from "@jest/globals";
import * as fc from "fast-check";

describe("CardRank", () => {
  it("should include valid ranks", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<CardRank>(
          "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"
        ),
        (rank) => {
          expect([
            "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"
          ]).toContain(rank);
        }
      )
    );
  });
});
