import fs from 'fs';
import path from 'path';
import { Game } from '@/app/interfaces/Game';
import { Deck } from '../Deck';
import { Hand } from '../Hand';
import { Dealer } from '../Dealer';
import { Gambler } from '../Gambler';
import { A, O, R } from '@mobily/ts-belt'

export class GamesConnector {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'games.json');
  }
  
  private loadFile(): Game[] {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data) as Game[];
    } catch (error) {
      console.error('Error reading games.json:', error);
      throw new Error('Unable to load games data.');
    }
  }
  
  private saveFile(data: Game[]): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing to games.json:', error);
      throw new Error('Unable to save games data.');
    }
  }
  
  addGame(gambler: Gambler, bet: number): R.Result<{ success: true, message: string, data: Game }, { success: boolean, message: string, data: null }> {
    try {
      const gameId = Date.now();
      
      const deck = new Deck([]).create().shuffle();
      
      const dealerHand = new Hand(crypto.randomUUID(), 0, [], false);
      const dealer = new Dealer([dealerHand]);
      dealer.hit(dealerHand, deck);
  
      const gamblerHand = new Hand(crypto.randomUUID(), bet, [], false);
      const current_gambler = new Gambler(gambler.id, gambler.name, gambler.tokens, [gamblerHand])
      current_gambler.hit(gamblerHand, deck);
      current_gambler.hit(gamblerHand, deck);
  
      const newGame: Game = 
      {
        id: gameId,
        gamblerData: {
          id: gambler.id,
          hands: [
            gamblerHand
          ]
        },  
        dealer: dealer,
        status: "Started",
        deck: deck
      } as Game
  
      const games = this.loadFile();
      games.push(newGame);
      this.saveFile(games);
  
      return R.Ok({ success: true, message: 'Game added successfully!', data: newGame });
    } catch (error) {
      console.error('Error adding new game:', error);
      return R.Error({ success: false, message: 'Failed to add game.', data: null });
    }
  }
  
  findGameById(id: number): R.Result<{success: boolean, message: string, data: Game}, { success: false, message: string, data: null }> {
    try {
      const games = this.loadFile();
      const game = A.find(games, (game) => game.id === id);
      if (O.isSome(game)) {
        return R.Ok({ success: true, message: 'Game found.', data: O.getExn(game) });
      };
      return R.Error({ success: false, message: 'Game not found.', data: null });
    } catch (error) {
      console.error(`Error finding game with ID ${id}:`, error);
      return R.Error({ success: false, message: 'Error finding game.', data: null });
    }
  }
  
  updateGameById(
    id: number,
    updates: Partial<Game>
  ): R.Result<
    { success: true; message: string; data: Game },
    { success: false; message: string; data: null }
  > {
    try {
      // Charger les jeux depuis le fichier
      const games = this.loadFile();
      
      // Trouver le jeu correspondant à l'ID
      const gameOption = A.find(games, (game) => game.id === id);
  
      if (O.isNone(gameOption)) {
        return R.Error({ success: false, message: 'Game not found.', data: null });
      }
  
      const game = gameOption; // Extraire la valeur de l'Option
      
      // Fusionner les données existantes avec les mises à jour
      const updatedGame: Game = {
        ...game,
        ...updates,
        gamblerData: {
          ...game.gamblerData,
          ...updates.gamblerData,
          hands: updates.gamblerData?.hands ?? game.gamblerData.hands,
        },
      };
  
      // Remplacer l'ancien jeu dans le tableau
      const gameIndex = games.findIndex((g) => g.id === id);
      games[gameIndex] = updatedGame;
  
      // Sauvegarder les jeux dans le fichier
      this.saveFile(games);
  
      // Retourner le succès
      return R.Ok({
        success: true,
        message: 'Game updated successfully.',
        data: updatedGame,
      });
    } catch (error) {
      console.error(`Error updating game with ID ${id}:`, error);
      return R.Error({
        success: false,
        message: 'Error updating game.',
        data: null,
      });
    }
  }
}
