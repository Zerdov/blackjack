import { POST } from './route';
import { GamblersConnector } from '@/app/classes/connectors/GamblersConnector';
import { GamesConnector } from '@/app/classes/connectors/GamesConnector';
import { R } from '@mobily/ts-belt';

jest.mock('@/app/classes/connectors/GamblersConnector');
jest.mock('@/app/classes/connectors/GamesConnector');

describe('POST /createGame', () => {
  let req: any;

  beforeEach(() => {
    req = {
      json: jest.fn(),
    };
    (GamblersConnector as jest.MockedClass<typeof GamblersConnector>).mockClear();
    (GamesConnector as jest.MockedClass<typeof GamesConnector>).mockClear();
  });

  it('should return 200 and game id on success', async () => {
    const gamblersConnector = new GamblersConnector();
    const gamesConnector = new GamesConnector();

    (gamblersConnector.updateGamblerTokensById as jest.Mock).mockReturnValue(true);
    (gamblersConnector.findGamblerById as jest.Mock).mockReturnValue(R.Ok({ id: 1735985785113 , tokens: 1000 }));
    (gamesConnector.addGame as jest.Mock).mockReturnValue(R.Ok({ data: { id: 1 } }));

    const response = await POST(req);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.message).toBe('success');
    expect(responseBody.id).toBe(1);
  });

  it('should return 400 if updating gambler tokens fails', async () => {
    const gamblersConnector = new GamblersConnector();
    (gamblersConnector.updateGamblerTokensById as jest.Mock).mockReturnValue(false);

    const response = await POST(req);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.message).toBe('Failed to update gambler tokens');
  });

  it('should return 404 if gambler is not found', async () => {
    const gamblersConnector = new GamblersConnector();
    (gamblersConnector.updateGamblerTokensById as jest.Mock).mockReturnValue(true);
    (gamblersConnector.findGamblerById as jest.Mock).mockReturnValue(R.Error('Not found'));

    const response = await POST(req);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody.message).toBe('Gambler not found');
  });

  it('should return 500 if creating game fails', async () => {
    const gamblersConnector = new GamblersConnector();
    const gamesConnector = new GamesConnector();

    (gamblersConnector.updateGamblerTokensById as jest.Mock).mockReturnValue(true);
    (gamblersConnector.findGamblerById as jest.Mock).mockReturnValue(R.Ok({ id: 1, tokens: 1000 }));
    (gamesConnector.addGame as jest.Mock).mockReturnValue(R.Error('Failed to create game'));

    const response = await POST(req);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.message).toBe('Failed to create game');
  });

  it('should return 500 on internal server error', async () => {
    req.json.mockRejectedValue(new Error('Internal error'));

    const response = await POST(req);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.message).toBe('Internal server error');
  });
});
