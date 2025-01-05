import { POST } from "./route"
import { NextRequest } from "next/server";
import { jest } from "@jest/globals";
import { Gambler } from "@/app/classes/Gambler";

jest.mock("@/app/classes/connectors/GamesConnector", () => ({
  GamesConnector: jest.fn().mockImplementation(() => ({
    findGameById: jest.fn((id) => {
      if (id === 1) {
        return {
          TAG: 0,
          _0: {
            success: true,
            message: "Game found",
            data: {
              id: 1,
              gamblerData: { id: 1, hands: [] },
              dealer: { hands: [] },
              status: "",
              deck: { cards: [] },
            },
          },
        };
      }
      return {
        TAG: 1,
        _0: { success: false, message: "Game not found", data: null },
      };
    }),
    updateGameById: jest.fn(() => ({
      TAG: 1,
      _0: { success: false, message: "", data: null },
    })),
  })),
}));

jest.mock("@/app/classes/connectors/GamblersConnector", () => ({
  GamblersConnector: jest.fn().mockImplementation(() => ({
    findGamblerById: jest.fn(() => ({
      TAG: 0,
      _0: new Gambler(1, "John", 100, []),
    })),
  })),
}));


describe("Dealing Endpoint", () => {
  it("should return 500 if game update fails", async () => {
    // Mock de la requête
    const req = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ gameId: 1 }),
    });

    // Appel de l'endpoint directement
    const res = await POST(req);
    const json = await res.json();

    // Vérifications
    expect(res.status).toBe(500);
    expect(json.message).toBe("Internal server error.");
  });
});
