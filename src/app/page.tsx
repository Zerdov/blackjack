'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [bet, setBet] = useState("");
  const router = useRouter();

  const createGame = async (): Promise<number> => {
    let result = -1;

    try {
      const response = await fetch('/api/createGame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bet }),
      });

      if (response.ok) {
        const data = await response.json();
        const gameId = data.id;
        result = gameId;
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire", error);
    }
    return result;
  };

  const redirectToNewGame = (gameId: String) => router.push(`/game/${gameId}`);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const request_result = (await createGame());
    request_result > -1 ? redirectToNewGame(request_result.toString()) : null 
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="bet">Your Bet</label>
      <input
        type="text"
        id="bet"
        value={bet}
        onChange={(e) => setBet(e.target.value)}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
}
