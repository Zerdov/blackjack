import { NextApiRequest, NextApiResponse } from 'next';
import { Hand } from '@/app/classes/Hand';
import { GamblersConnector } from '@/app/classes/connectors/GamblersConnector';
import { R } from '@mobily/ts-belt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { hand: rawHand, gamblerId } = req.body; // Récupérer la main et l'ID du joueur

    // Vérification des paramètres
    if (!rawHand || !gamblerId) {
      return res.status(400).json({ message: 'Hand and gamblerId are required.' });
    }

    // Récupérer le Gambler à partir de l'ID
    const connector = new GamblersConnector();
    const gambler = connector.findGamblerById(gamblerId);

    if (R.isError(gambler)) {
      return res.status(404).json({ message: 'Gambler not found.' });
    }

    // Convertir la main en instance appropriée
    const hand = Hand.fromJSON(rawHand);

    // Exécuter l'action "stand" via la méthode du Gambler
    const result = R.getExn(gambler).stand(hand);

    // Renvoyer la main mise à jour
    res.status(200).json({
      hand: result.toJSON(), // Convertir la main en JSON
    });

  } catch (error) {
    console.error('Error handling /api/stand:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}
