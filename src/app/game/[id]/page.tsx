import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Game } from '@/app/classes/Game';
import { GamesConnector } from '@/app/classes/connectors/GamesConnector';
import { Hand } from '@/app/classes/Hand';
import { Deck } from '@/app/classes/Deck';
import { R } from '@mobily/ts-belt';
import { Gambler } from '@/app/classes/Gambler';

export default async function GamePage({ params }: { params: { gameId: string } }) {
  const { gameId } = await params;

  const gamesConnector = new GamesConnector();
  const game = gamesConnector.findGameById(parseInt(gameId));

  if (!game) {
    notFound();
  }

  const hit = async (hand: Hand, deck: Deck, gamblerId: string): Promise<R.Result<{ hand: Hand; deck: Deck }, string>> => {
    try {
      // Préparation des données pour l'API
      const response = await fetch('/api/hit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hand: hand.toJSON(), // Convertir la main en JSON
          deck: deck.toJSON(), // Convertir le deck en JSON
          gamblerId, // L'ID du joueur
        }),
      });
  
      if (!response.ok) {
        // Gestion des erreurs HTTP
        const error = await response.json();
        return R.Error(error.message || 'Failed to hit.');
      }
  
      // Lecture de la réponse
      const data = await response.json();
  
      // Validation et retour des données (main et deck mis à jour)
      if (data.hand && data.deck) {
        return R.Ok({
          hand: Hand.fromJSON(data.hand),  // Convertir la main en instance de Hand
          deck: Deck.fromJSON(data.deck),  // Convertir le deck en instance de Deck
        });
      } else {
        return R.Error('Invalid response from server.');
      }
    } catch (error) {
      // Gestion des erreurs réseau ou autres
      console.error('Error contacting /api/hit:', error);
      return R.Error('An error occurred while contacting the server.');
    }
  };  

  const split = async (hand: Hand, deck: Deck, gamblerId: string): Promise<R.Result<{ hands: Hand[]; deck: Deck }, string>> => {
    try {
      // Préparation des données pour l'API
      const response = await fetch('/api/split', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hand: hand.toJSON(), // Convertir la main en JSON
          deck: deck.toJSON(), // Convertir le deck en JSON
          gamblerId, // L'ID du joueur
        }),
      });
  
      if (!response.ok) {
        // Gestion des erreurs HTTP
        const error = await response.json();
        return R.Error(error.message || 'Failed to split.');
      }
  
      // Lecture de la réponse
      const data = await response.json();
  
      // Validation et retour des nouvelles mains et du deck
      if (data.hands && data.deck) {
        return R.Ok({
          hands: data.hands.map((h: any) => Hand.fromJSON(h)),  // Convertir les mains en instances de Hand
          deck: Deck.fromJSON(data.deck),  // Convertir le deck en instance de Deck
        });
      } else {
        return R.Error('Invalid response from server.');
      }
    } catch (error) {
      // Gestion des erreurs réseau ou autres
      console.error('Error contacting /api/split:', error);
      return R.Error('An error occurred while contacting the server.');
    }
  };  

  const stand = async (hand: Hand, gamblerId: string): Promise<R.Result<Hand, string>> => {
    try {
      // Préparation des données pour l'API
      const response = await fetch('/api/stand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hand: hand.toJSON(), // Convertir la main en JSON
          gamblerId, // L'ID du joueur
        }),
      });
  
      if (!response.ok) {
        // Gestion des erreurs HTTP
        const error = await response.json();
        return R.Error(error.message || 'Failed to stand.');
      }
  
      // Lecture de la réponse
      const data = await response.json();
  
      // Validation et retour de la main mise à jour
      if (data.hand) {
        return R.Ok(Hand.fromJSON(data.hand));  // Convertir la main en instance de Hand
      } else {
        return R.Error('Invalid response from server.');
      }
    } catch (error) {
      // Gestion des erreurs réseau ou autres
      console.error('Error contacting /api/stand:', error);
      return R.Error('An error occurred while contacting the server.');
    }
  };
  
  
  const doubleDown = async (hand: Hand, playerId: string): Promise<R.Result<{ hand: Hand }, string>> => {
    try {
      // Préparation des données pour l'API
      const response = await fetch('/api/doubleDown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hand: hand.toJSON(), playerId }), // Passer l'ID du joueur
      });
  
      if (!response.ok) {
        // Gestion des erreurs HTTP
        const error = await response.json();
        return R.Error(error.message || 'Failed to double down.');
      }
  
      // Lecture de la réponse
      const data = await response.json();
  
      // Validation et retour de la main mise à jour
      if (data.hand) {
        return R.Ok({
          hand: Hand.fromJSON(data.hand), // Convertir en instance de Hand
        });
      } else {
        return R.Error('Invalid response from server.');
      }
    } catch (error) {
      // Gestion des erreurs réseau ou autres
      console.error('Error contacting /api/doubleDown:', error);
      return R.Error('An error occurred while contacting the server.');
    }
  };

  // Fonction pour appeler l'API de surrender
  const surrender = async (gamblerId: number, hand: Hand): Promise<R.Result<{ gambler: Gambler; hand: Hand }, string>> => {
    try {
      // Envoyer la requête POST vers /api/surrender
      const response = await fetch('/api/surrender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gamblerId, hand }),
      });

      // Si la requête échoue
      if (!response.ok) {
        const error = await response.json();
        return R.Error(error.message || 'Failed to surrender.');
      }

      // Lire la réponse
      const data = await response.json();

      if (data.gambler && data.hand) {
        return R.Ok({
          gambler: data.gambler,
          hand: data.hand,
        });
      } else {
        return R.Error('Invalid response from server.');
      }
    } catch (error) {
      // En cas d'erreur réseau
      console.error('Error contacting /api/surrender:', error);
      return R.Error('An error occurred while contacting the server.');
    }
  };

  return(
    // <section id="actions">
    //   <button type="button" onClick={hit}>Hit</button>
    //   <button type="button">Stand</button>
    //   <button type="button">Double Down</button>
    //   <button type="button">Split</button>
    //   <button type="button">Surrender</button>
    // </section>
    <h1>Bonjour !</h1>
  )
}
