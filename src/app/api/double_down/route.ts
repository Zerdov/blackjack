import { NextApiRequest, NextApiResponse } from 'next';
import { Hand } from '@/app/classes/Hand';
import { GamblersConnector } from '@/app/classes/connectors/GamblersConnector';
import { Deck } from '@/app/classes/Deck';
import { R } from '@mobily/ts-belt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { hand: rawHand, gamblerId, deck: rawDeck } = req.body; // Récupérer la main, l'ID du joueur et le deck

    // Vérification des paramètres
    if (!rawHand || !gamblerId || !rawDeck) {
      return res.status(400).json({ message: 'Hand, gamblerId, and deck are required.' });
    }

    // Récupérer le Gambler à partir de l'ID
    const connector = new GamblersConnector();
    const gambler = connector.findGamblerById(gamblerId);

    if (R.isError(gambler)) {
      return res.status(404).json({ message: 'Gambler not found.' });
    }

    // Convertir la main et le deck en instances appropriées
    const hand = Hand.fromJSON(rawHand);
    const deck = Deck.fromJSON(rawDeck);

    // Exécuter l'action "double down" via la méthode du Gambler
    const result = R.getExn(gambler).doubleDown(hand, deck);

    if (R.isError(result)) {
      return res.status(400).json({ message: "Double Down is not allowed." });
    }

    // Renvoyer la main mise à jour, le deck et la nouvelle mise
    res.status(200).json({
      hand: R.getExn(result).hand.toJSON(),  // Convertir la main mise à jour en JSON
      deck: R.getExn(result).deck.toJSON(),  // Convertir le deck mis à jour en JSON
      bet: R.getExn(result).hand.bet,  // Nouvelle mise
    });

  } catch (error) {
    console.error('Error handling /api/doubleDown:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}
