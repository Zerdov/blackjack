import { POST } from './route';
import { NextRequest } from 'next/server';
import { GamesConnector } from '@/app/classes/connectors/GamesConnector';
import { GamblersConnector } from '@/app/classes/connectors/GamblersConnector';
import { Hand } from '@/app/classes/Hand';
import { Deck } from '@/app/classes/Deck';
import { Gambler } from '@/app/classes/Gambler';

// Mock dependencies
jest.mock('@/app/classes/connectors/GamesConnector');
jest.mock('@/app/classes/connectors/GamblersConnector');
jest.mock('@/app/classes/Hand');
jest.mock('@/app/classes/Deck');
jest.mock('@/app/classes/Gambler');

describe('POST /api/phases/actions', () => {
  let req: NextRequest;

  beforeEach(() => {
    req = {
      json: jest.fn() as jest.MockedFunction<() => Promise<any>>,
    } as unknown as NextRequest;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if required parameters are missing', async () => {
    (req.json as jest.Mock).mockResolvedValue({});
    const response = await POST(req);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.message).toBe('Missing required parameters.');
  });

  it('should return 404 if game is not found', async () => {
    (req.json as jest.Mock).mockResolvedValue({ gameId: 1735985785113, action: 'hit', handId: 1 });
    (GamesConnector.prototype.findGameById as jest.Mock).mockReturnValue({ isError: true });
    const response = await POST(req);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.message).toBe('Game not found.');
  });

  it('should return 404 if gambler is not found', async () => {
    (req.json as jest.Mock).mockResolvedValue({ gameId: 1735985785113, action: 'hit', handId: 1, gamblerId: 1 });
    (GamesConnector.prototype.findGameById as jest.Mock).mockReturnValue({ isError: false, value: {} });
    (GamblersConnector.prototype.findGamblerById as jest.Mock).mockReturnValue({ isError: true });
    const response = await POST(req);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.message).toBe('Gambler not found.');
  });

  // Add more tests for each action (hit, stand, doubleDown, split, surrender)
  // Example for 'hit' action
  it('should handle hit action successfully', async () => {
    (req.json as jest.Mock).mockResolvedValue({ gameId: 1735985785113, action: 'hit', handId: 1 });
    (GamesConnector.prototype.findGameById as jest.Mock).mockReturnValue({ isError: false, value: { data: { gamblerData: { hands: [] }, deck: {} } } });
    (GamblersConnector.prototype.findGamblerById as jest.Mock).mockReturnValue({ isError: false, value: { id: 1, name: 'Test', tokens: 100 } });
    (Hand.fromJSON as jest.Mock).mockReturnValue({ id: 1, isActive: jest.fn().mockReturnValue(true) });
    (Deck.fromJSON as jest.Mock).mockReturnValue({});
    (Gambler.prototype.hit as jest.Mock).mockReturnValue({ isError: false, value: { hand: {}, deck: {} } });
    (GamesConnector.prototype.updateGameById as jest.Mock).mockReturnValue({ isError: false });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe('Hit successful.');
  });
});
