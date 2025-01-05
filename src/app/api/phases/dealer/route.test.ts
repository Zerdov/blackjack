import { POST } from './route';
import { GamesConnector } from '@/app/classes/connectors/GamesConnector';
import { R } from '@mobily/ts-belt';

jest.mock('@/app/classes/connectors/GamesConnector');

describe('POST /dealer', () => {
  let req: any;

  beforeEach(() => {
    req = {
      json: jest.fn().mockResolvedValue({ gameId: 1735985785113 })
    };
    jest.clearAllMocks();
  });

  it('should return 200 and updated dealer hand on success', async () => {
    const gamesConnector = new GamesConnector();
    (gamesConnector.findGameById as jest.Mock).mockReturnValue(R.Ok({ data: { dealer: { hands: [{ id: 1, cards: [] }] }, deck: {} } }));
    (gamesConnector.updateGameById as jest.Mock).mockReturnValue(R.Ok({}));

    const response = await POST(req);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.message).toBe("Dealer's turn completed successfully.");
  });

  it('should return 400 if gameId is invalid', async () => {
    req.json.mockResolvedValue({ gameId: null });

    const response = await POST(req);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.message).toBe('Invalid gameId provided.');
  });

  it('should return 404 if game is not found', async () => {
    const gamesConnector = new GamesConnector();
    (gamesConnector.findGameById as jest.Mock).mockReturnValue(R.Error('Not found'));

    const response = await POST(req);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody.message).toBe('Game not found.');
  });

  it('should return 500 if dealer has no hands', async () => {
    const gamesConnector = new GamesConnector();
    (gamesConnector.findGameById as jest.Mock).mockReturnValue(R.Ok({ data: { dealer: { hands: [] }, deck: {} } }));

    const response = await POST(req);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.message).toBe('Dealer has no hands.');
  });

  it('should return 500 on internal server error', async () => {
    req.json.mockRejectedValue(new Error('Internal error'));

    const response = await POST(req);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.message).toBe('Internal server error.');
  });
});
