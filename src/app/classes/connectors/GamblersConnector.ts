import fs from 'fs';
import path from 'path';
import { R, O, A, pipe } from '@mobily/ts-belt';
import { Gambler } from '../Gambler';

export class GamblersConnector {
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'gamblers.json');
  }

  // Charger les données depuis le fichier JSON
  private loadFile(): R.Result<Gambler[], string> {
    return pipe(
      R.fromExecution(() => fs.readFileSync(this.filePath, 'utf-8')),
      R.mapError(() => 'Unable to load gamblers data.'),
      R.flatMap((data) =>
        pipe(
          R.fromExecution(() => JSON.parse(data) as Gambler[]),
          R.mapError(() => 'Invalid JSON format in gamblers file.')
        )
      )
    )
  }

  // Sauvegarder les données dans le fichier JSON
  private saveFile(data: Gambler[]): R.Result<void, string> {
    return pipe(
      R.fromExecution(() => fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2))),
      R.mapError(() => 'Unable to save gamblers data.')
    );
  }

  // Trouver un joueur par ID
  findGamblerById(id: number): R.Result<Gambler, string> {
    return pipe(
      this.loadFile(),
      R.flatMap((gamblers) =>
        pipe(
          A.find(gamblers, (gambler) => gambler.id === id),
          O.toResult(`Gambler with ID ${id} not found.`)
        )
      )
    );
  }

  // Mettre à jour les tokens d'un joueur par ID
  updateGamblerTokensById(id: number, bet: number): R.Result<Gambler, string> {
    return pipe(
      this.loadFile(),
      R.flatMap((gamblers) =>
        pipe(
          A.find(gamblers, (gambler) => gambler.id === id),
          O.toResult(`Gambler with ID ${id} not found.`),
          R.flatMap((gambler) =>
            gambler.tokens >= bet
              ? R.Ok({ gamblers, gambler })
              : R.Error(`Insufficient tokens for gambler ID ${id}.`)
          )
        )
      ),
      R.flatMap(({ gamblers, gambler }) => {
        gambler.tokens -= bet;
        return pipe(
          this.saveFile(gamblers),
          R.map(() => gambler)
        );
      })
    );
  }
}
