import { NextApiRequest, NextApiResponse } from 'next';
import { Hand } from '@/app/classes/Hand';
import { Deck } from '@/app/classes/Deck';
import { GamblersConnector } from '@/app/classes/connectors/GamblersConnector'; // Assurez-vous d'importer correctement
import { R } from '@mobily/ts-belt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { hand: rawHand, deck: rawDeck, gamblerId } = req.body; // Récupérer la main, le deck, et l'ID du joueur

    // Vérification des paramètres
    if (!rawHand || !rawDeck || !gamblerId) {
      return res.status(400).json({ message: 'Hand, deck, and gamblerId are required.' });
    }

    // Récupérer le Gambler à partir de l'ID
    const connector = new GamblersConnector();
    const gambler = connector.findGamblerById(gamblerId);

    if (R.isError(gambler)) {
      return res.status(404).json({ message: 'Gambler not found.' });
    }

    // Convertir les objets JSON en instances appropriées
    const hand = Hand.fromJSON(rawHand);
    const deck = Deck.fromJSON(rawDeck);

    // Exécuter l'action "split" via la méthode du Gambler
    const result = R.getExn(gambler).split(hand, deck);

    if (R.isError(result)) {
      return res.status(400).json({ message: 'Not able to split.' });
    }

    // Renvoyer les nouvelles mains et le deck mis à jour
    res.status(200).json({
      hands: R.getExn(result).hands.map((h) => h.toJSON()),  // Convertir les mains en JSON
      deck: R.getExn(result).deck.toJSON(),  // Convertir le deck en JSON
    });

  } catch (error) {
    console.error('Error handling /api/split:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}
