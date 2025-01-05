import { POST } from "./route";
import { NextRequest } from "next/server";
import { jest } from "@jest/globals";

jest.mock("@/app/classes/connectors/GamesConnector", () => ({
  GamesConnector: jest.fn().mockImplementation(() => ({
    findGameById: jest.fn(),
    updateGameById: jest.fn(),
  })),
}));

jest.mock("@/app/classes/connectors/GamblersConnector", () => ({
  GamblersConnector: jest.fn().mockImplementation(() => ({
    findGamblerById: jest.fn(),
    updateGamblerTokensById: jest.fn(),
  })),
}));

describe("Payout Endpoint", () => {
  it("should return 404 if the game is not found", async () => {
    const { GamesConnector } = require("@/app/classes/connectors/GamesConnector");

    // Moquer le retour de `findGameById` pour qu'il retourne une erreur.
    GamesConnector.mockImplementationOnce(() => ({
      findGameById: jest.fn().mockReturnValueOnce({
        TAG: 1,
        _0: { success: false, message: "Game not found", data: null },
      }),
      updateGameById: jest.fn(),
    }));

    // Mock de la requête
    const req = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ gameId: 999 }), // ID qui n'existe pas
    });

    // Appel de l'endpoint
    const res = await POST(req);
    const json = await res.json();

    // Vérifications
    expect(res.status).toBe(404);
    expect(json.message).toBe("Game not found.");
  });
});
