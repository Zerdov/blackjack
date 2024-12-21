import { GamblersConnector } from '@/app/classes/connectors/GamblersConnector';
import { GamesConnector } from '@/app/classes/connectors/GamesConnector';

export async function POST(req: { json: () => PromiseLike<{ bet: string; }> | { bet: string; }; }) {
  try {
    const { bet } = await req.json();
    const intBet = parseInt(bet);
  
    const gamesConnector = new GamesConnector();
    const gamblersConnector = new GamblersConnector();
  
    const updateSuccess = gamblersConnector.updateGamblerTokensById(1, intBet);
    if (!updateSuccess) {
      return new Response(JSON.stringify({ message: 'Failed to update gambler tokens' }), { status: 400 });
    }
  
    const gambler = gamblersConnector.findGamblerById(1).data;
    console.log(gambler);
    if (!gambler) {
      return new Response(JSON.stringify({ message: 'Gambler not found' }), { status: 404 });
    }

    const newGame = gamesConnector.addGame(gambler, intBet).data;
    if (newGame) {
      return new Response(JSON.stringify({ message: 'success', id: newGame.id }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ message: 'Failed to create game' }), { status: 500 });
    }
  } catch (error) {
    console.error('Error during POST request:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
