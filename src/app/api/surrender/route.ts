import { NextApiRequest, NextApiResponse } from 'next';
import { Gambler } from '@/app/classes/Gambler';
import { GamblersConnector } from '@/app/classes/connectors/GamblersConnector';
import { R } from '@mobily/ts-belt';

const handleSurrender = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      // Extraire les données envoyées dans la requête
      const { gamblerId, hand } = req.body;

      // Charger le gambler via l'ID
      const connector = new GamblersConnector();
      const gamblerResult = connector.findGamblerById(gamblerId);

      if (R.isError(gamblerResult)) {
        return res.status(404).json({ message: 'Gambler not found.' });
      }

      const gambler = R.getExn(gamblerResult);

      // Appeler la méthode surrender de Gambler pour effectuer l'action
      const surrenderResult = gambler.surrender(hand);

      // Retourner la réponse avec le nouveau gambler et la nouvelle main
      return res.status(200).json({
        gambler: surrenderResult.gambler,
        hand: surrenderResult.hand,
      });
    } catch (error) {
      console.error('Error during surrender:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    // Si ce n'est pas une méthode POST
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
};

export default handleSurrender;
