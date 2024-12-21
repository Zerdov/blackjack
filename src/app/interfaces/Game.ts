import { Dealer } from "../classes/Dealer";
import { Deck } from "../classes/Deck";
import { Hand } from "../classes/Hand";

export interface Game {
  id: number;
  gamblerData: { id: number; hands: Hand[] };
  dealer: Dealer;
  status: string;
  deck: Deck;
}
