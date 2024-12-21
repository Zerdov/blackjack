import { matchR } from "@/utils/match";
import { Dealer } from "./Dealer";
import { Deck } from "./Deck";
import { Hand } from "./Hand";
import { GamblersConnector } from "./connectors/GamblersConnector";
import { R, O, pipe, A } from "@mobily/ts-belt";
import { Gambler } from "./Gambler";

export class Game {
  private id: number;
  private gamblerData: { id: number; hands: Hand[] };
  private dealer: Dealer;
  private status: string;
  private deck: Deck;

  constructor(
    id: number,
    gamblerData: { id: number; hands: Hand[] },
    dealer: Dealer,
    deck: Deck,
    status: string
  ) {
    this.id = id;
    this.gamblerData = gamblerData;
    this.dealer = dealer;
    this.status = status;
    this.deck = deck;
  }

  // Afficher les mains du dealer et du joueur
  showHands(): string {
    const dealerHand = this.dealer.hands[0]?.toString() || "No hand";
    const gamblerHands = this.gamblerData.hands.map((hand) => hand.toString()).join(", ");

    return `Dealer's hand: ${dealerHand}\nGambler ${this.gamblerData.id}'s hands: ${gamblerHands}\n`;
  }

  // Démarrer le jeu
  startGame(): Game {
    return new Game(this.id, this.gamblerData, this.dealer, this.deck, "Started");
  }

  // Phase de mise
  bettingPhase(bet: number): R.Result<Game, string> {
    const connector = new GamblersConnector();

    return pipe(
      connector.findGamblerById(this.gamblerData.id),
      R.flatMap((gambler) =>
        gambler.tokens >= bet
          ? R.Ok(gambler)
          : R.Error(`Gambler ${gambler.name} has insufficient tokens.`)
      ),
      R.map((gambler) => {
        const updatedHands = A.append(this.gamblerData.hands, new Hand(crypto.randomUUID(), bet, [], false));
        return new Game(this.id, { ...this.gamblerData, hands: [...updatedHands] }, this.dealer, this.deck, this.status);
      })
    );
  }

  // Phase de distribution
  dealingPhase(): R.Result<Game, string> {
    const connector = new GamblersConnector();
    const gambler = R.getExn(connector.findGamblerById(this.gamblerData.id));

    // Étape 1 : Distribuer la carte au dealer
    if (!this.dealer.hands[0]) {
      return R.Error("Dealer has no hands to deal cards to.");
    }
  
    const dealerHitResult = this.dealer.hit(this.dealer.hands[0], this.deck);
    if (R.isError(dealerHitResult)) {
      return R.Error("Error dealing card to the dealer.");
    }
  
    const updatedDealer = new Dealer([R.getExn(dealerHitResult).hand]);
    let updatedDeck = R.getExn(dealerHitResult).deck;
  
    // Étape 2 : Distribuer une carte au joueur
    if (!gambler.hands[0]) {
      return R.Error("Gambler has no hands to deal cards to.");
    }

    const gamblerHitResult = gambler.hit(gambler.hands[0], updatedDeck);
    if (R.isError(gamblerHitResult)) {
      return R.Error("Error dealing card to the gambler.");
    }

    const updatedGambler = new Gambler(gambler.id, gambler.name, gambler.tokens, [R.getExn(gamblerHitResult).hand]);
    updatedDeck = R.getExn(dealerHitResult).deck;
  
    // Retourner le nouvel état du jeu
    return R.Ok(
      new Game(
        this.id,
        { ...this.gamblerData, hands: updatedGambler.hands },
        updatedDealer,
        updatedDeck,
        this.status
      )
    );
  }
  
  // Phase d'actions des joueurs
  gamblerActionsPhase(): R.Result<Game, string> {
    const connector = new GamblersConnector();
    const gambler = R.getExn(connector.findGamblerById(this.gamblerData.id));
    const playableHands = this.gamblerData.hands.filter((hand) => !hand.isBusted() && !hand.stood);
    let updatedHands = [...this.gamblerData.hands];
    let updatedDeck = this.deck;

    A.map(
      playableHands,
      (hand) => {
        const action = prompt(
          `[st]and, [h]it,${hand.isSplitable() ? " [sp]lit," : ""} [d]ouble down, [su]rrender`
        ) || "";
        const result = () => {
          switch (action) {
            case "h":
              pipe(
                gambler.hit(hand, updatedDeck),
                matchR(
                  Ok: (hand, deck) => new Gambler(gambler.id, gambler.name, gambler.tokens, A.filter())
                )
              );
              break;
            case "st":
              hand.stood = true;
              break;
            // Ajouter d'autres cas comme le split, le double down, etc.
            default:
              console.log("Invalid action. Try again.");
          }
        }
      }
    )
    

    return R.Ok(
      new Game(this.id, { ...this.gamblerData, hands: updatedHands }, this.dealer, updatedDeck, this.status)
    );
  }

  // Phase d'actions du dealer
  dealerActionsPhase(): R.Result<Game, string> {
    const dealerHand = this.dealer.hands[0];
    let updatedDeck = this.deck;

    while (dealerHand.calculateScore() < 17) {
      pipe(
        dealerHand.hit(updatedDeck),
        R.map((result) => {
          updatedDeck = result.deck;
        })
      );
    }

    if (dealerHand.calculateScore() <= 21) {
      dealerHand.stand();
    }

    return R.Ok(new Game(this.id, this.gamblerData, this.dealer, updatedDeck, this.status));
  }

  // Phase de paiement
  payoutPhase(): R.Result<Game, string> {
    const dealerHand = this.dealer.hands[0];
    const dealerScore = dealerHand.calculateScore();
    const dealerBusted = dealerHand.isBusted();

    const updatedHands = this.gamblerData.hands.map((hand) => {
      const gamblerScore = hand.calculateScore();

      if (hand.isBusted()) {
        console.log(`Hand busted. Bet lost: ${hand.bet}`);
        return hand;
      }

      if (dealerBusted || gamblerScore > dealerScore) {
        console.log(`Gambler wins. Gains ${hand.bet * 2} tokens.`);
        return { ...hand, tokens: hand.tokens + hand.bet * 2 };
      }

      if (gamblerScore === dealerScore) {
        console.log(`Push. Bet returned: ${hand.bet}`);
        return { ...hand, tokens: hand.tokens + hand.bet };
      }

      console.log(`Gambler loses. Bet lost: ${hand.bet}`);
      return hand;
    });

    return R.Ok(new Game(this.id, { ...this.gamblerData, hands: updatedHands }, this.dealer, this.deck, this.status));
  }
}
