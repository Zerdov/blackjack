import { NextApiRequest, NextApiResponse } from 'next';
import { GamesConnector } from '@/app/classes/connectors/GamesConnector';
import { Deck } from '@/app/classes/Deck';
import { R } from '@mobily/ts-belt';

const handleDealing = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      const { gameId } = req.body; // Récupérer l'ID de la partie

      // Charger la partie
      const gameConnector = new GamesConnector();
      const gameResult = gameConnector.findGameById(gameId);

      if (R.isError(gameResult)) {
        return res.status(404).json({ message: 'Game not found.' });
      }

      const game = R.getExn(gameResult);

      // Récupérer le deck existant
      const deck = new Deck(game.data.deck.cards);

      // Ajouter des cartes à la main du joueur et du dealer
      const gamblerHand = game.data.gamblerData.hands[0];
      const dealerHand = game.data.dealer.hands[0];

      // Ajouter une carte pour le dealer
      const drawDealerCard = deck.drawCard();
      if (R.isError(drawDealerCard)) {
        return res.status(400).json({ message: 'Failed to draw a card for the dealer.' });
      }
      const { card: dealerCard, deck: deckAfterDealer } = R.getExn(drawDealerCard);
      dealerHand?.addCard(dealerCard);

      // Ajouter deux cartes pour le joueur
      const drawGamblerCard1 = deckAfterDealer.drawCard();
      if (R.isError(drawGamblerCard1)) {
        return res.status(400).json({ message: 'Failed to draw the first card for the gambler.' });
      }
      const { card: gamblerCard1, deck: deckAfterGamblerCard1 } = R.getExn(drawGamblerCard1);
      gamblerHand?.addCard(gamblerCard1);

      const drawGamblerCard2 = deckAfterGamblerCard1.drawCard();
      if (R.isError(drawGamblerCard2)) {
        return res.status(400).json({ message: 'Failed to draw the second card for the gambler.' });
      }
      const { card: gamblerCard2, deck: deckAfterGamblerCard2 } = R.getExn(drawGamblerCard2);
      gamblerHand?.addCard(gamblerCard2);

      // Sauvegarder la partie mise à jour avec les nouvelles cartes
      const updateResult = gameConnector.updateGameById(gameId, {
        deck: deckAfterGamblerCard2,
        gamblerData: game.data.gamblerData,
        dealer: game.data.dealer,
        status: 'Dealing Done', // Optionnel, changer l'état si nécessaire
      });

      if (R.isError(updateResult)) {
        return res.status(500).json({ message: 'Failed to update the game.' });
      }

      return res.status(200).json({
        message: 'Dealing complete.',
        gamblerHand: gamblerHand?.toJSON(),
        dealerHand: dealerHand?.toJSON(),
        deck: deckAfterGamblerCard2.toJSON(),
      });
    } catch (error) {
      console.error('Error during dealing phase:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
};

export default handleDealing;
