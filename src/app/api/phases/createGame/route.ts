import { GamblersConnector } from '@/app/classes/connectors/GamblersConnector';
import { GamesConnector } from '@/app/classes/connectors/GamesConnector';
import { Gambler } from '@/app/classes/Gambler';
import { R } from '@mobily/ts-belt';

export async function POST(req: { json: () => PromiseLike<{ bet: string; }> | { bet: string; }; }) {
  try {
    const { bet } = await req.json();
    const intBet = parseInt(bet);
  
    if (isNaN(intBet)) {
      return new Response(JSON.stringify({ error: "Invalid bet: not a number" }), { status: 400 });
    }

    const gamesConnector = new GamesConnector();
    const gamblersConnector = new GamblersConnector();
  
    const updateSuccess = gamblersConnector.updateGamblerTokensById(1, intBet);
    if (!updateSuccess) {
      return new Response(JSON.stringify({ message: 'Failed to update gambler tokens' }), { status: 400 });
    }
  
    const gamblerResult = gamblersConnector.findGamblerById(1);
    if (R.isError(gamblerResult)) {
      return new Response(JSON.stringify({ message: 'Gambler not found' }), { status: 404 });
    }

    const gambler = R.getExn(gamblerResult);
    if (intBet > gambler.tokens) {
      return new Response(JSON.stringify({ message: 'Not enough money' }), { status: 500 });
    }

    const newGame = gamesConnector.addGame(gambler, intBet);
    if (R.isOk(newGame)) {
      return new Response(JSON.stringify({ message: 'success', id: R.getExn(newGame).data.id }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ message: 'Failed to create game' }), { status: 500 });
    }
  } catch (error) {
    console.error('Error during POST request:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
