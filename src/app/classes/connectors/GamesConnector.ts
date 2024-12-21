import fs from 'fs';
import path from 'path';
import { Game } from '../Game';
import { Deck } from '../Deck';
import { Result } from '@/app/interfaces/Result';
import { Hand } from '../Hand';
import { Dealer } from '../Dealer';
import { Gambler } from '../Gambler';
import { R } from '@mobily/ts-belt'

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
  
  addGame(gambler: Gambler, bet: number): Result<Game> {
    try {
      const gameId = Date.now();
      
      const deck = new Deck([]);
      deck.cards = deck.shuffle();
      deck.shuffle();
      
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
        gambler_data: {
          id: gambler.id,
          hands: [
            gamblerHand
          ]
        },  
        dealer: dealer,
        status: "Not Started",
        deck: deck
      } as Game
  
      const games = this.loadFile();
      games.push(newGame);
      this.saveFile(games);
  
      return { success: true, message: 'Game added successfully!', data: newGame };
    } catch (error) {
      console.error('Error adding new game:', error);
      return { success: false, message: 'Failed to add game.' };
    }
  }
  
  findGameById(id: number): Result<Game | null> {
    try {
      const games = this.loadFile();
      const game = games.find((game) => game.id === id) || null;
      return {
        success: !!game,
        message: game ? 'Game found.' : 'Game not found.',
        data: game,
      };
    } catch (error) {
      console.error(`Error finding game with ID ${id}:`, error);
      return { success: false, message: 'Error finding game.' };
    }
  }
  
  updateGameById(id: number, updates: Partial<Game>): Result<Game> {
    try {
      const games = this.loadFile();
      const game = games.find((game) => game.id === id);
  
      if (!game) {
        return { success: false, message: `Game with ID ${id} not found.` };
      }
  
      const updatedGame = { ...game, ...updates };
  
      const newGame = new Game(updatedGame.id, updatedGame.gambler_data, updatedGame.dealer, updatedGame.deck);
  
      const gameIndex = games.findIndex((game) => game.id === id);
      games[gameIndex] = newGame;
  
      this.saveFile(games);
  
      return { success: true, message: 'Game updated successfully!', data: newGame };
    } catch (error) {
      console.error(`Error updating game with ID ${id}:`, error);
      return { success: false, message: 'Failed to update game.' };
    }
  }
  
}
