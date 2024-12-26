import { NextApiRequest, NextApiResponse } from 'next';
import { GamesConnector } from '@/app/classes/connectors/GamesConnector';
import { GamblersConnector } from '@/app/classes/connectors/GamblersConnector';
import { R } from '@mobily/ts-belt';
import { Deck } from '@/app/classes/Deck';
import { Hand } from '@/app/classes/Hand';

const playerActionsPhase = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      const { gameId, action, gamblerId, handId } = req.body;

      // Récupérer la partie depuis le connecteur
      const gameConnector = new GamesConnector();
      const gameResult = gameConnector.findGameById(gameId);
      if (R.isError(gameResult)) {
        return res.status(404).json({ message: 'Game not found.' });
      }

      // Récupérer le joueur depuis le connecteur
      const gamblerConnector = new GamblersConnector();
      const gamblerResult = gamblerConnector.findGamblerById(gamblerId);
      if (R.isError(gamblerResult)) {
        return res.status(404).json({ message: 'Game not found.' });
      }

      const game = R.getExn(gameResult);
      const gambler = R.getExn(gamblerResult);
      const hand = game.data.gamblerData.hands.find((h) => h.id === handId);
      if (!hand) {
        return res.status(404).json({ message: 'Hand not found for gambler.' });
      }

      // Gérer les différentes actions du joueur
      switch (action) {
        case 'hit':
          const hitResult = gambler.hit(hand, game.data.deck);
          if (R.isError(hitResult)) {
            return res.status(500).json({ message: "Error when trying to hit" });
          }
          
          const { hand: handAfterHit, deck: deckAfterHit } = R.getExn(hitResult);

        case 'stand':
          gambler.stand(hand);  

        case 'doubleDown':
          gambler.doubleDown(hand, game.data.deck);

        case 'split':
          gambler.split(hand, game.data.deck);

        case 'surrender':
          gambler.surrender(hand);

        default:
          return res.status(400).json({ message: 'Invalid action.' });
      }
    } catch (error) {
      console.error('Error during player action phase:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
};

export default playerActionsPhase;
