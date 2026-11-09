import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceController } from './voice.controller.js';
import { VoiceService } from './voice.service.js';

describe('VoiceController', () => {
  let controller: VoiceController;
  let service: VoiceService;

  const mockUser = { userId: 'user_123' };

  beforeEach(() => {
    service = {
      startSession: vi.fn(),
      handleTurn: vi.fn(),
      endSession: vi.fn(),
      getSessions: vi.fn(),
      getSessionById: vi.fn(),
      deleteSession: vi.fn(),
    } as any;

    controller = new VoiceController(service);
  });

  it('delegates startSession to VoiceService', async () => {
    const dto = { scenarioPreset: 'coffee_shop' };
    (service.startSession as any).mockResolvedValue({ sessionId: 's_1' });

    const result = await controller.startSession(dto, mockUser);
    expect(service.startSession).toHaveBeenCalledWith('user_123', dto);
    expect(result).toEqual({ sessionId: 's_1' });
  });

  it('delegates handleTurn to VoiceService', async () => {
    const dto = { sessionId: 's_1', userTranscript: 'Hello' };
    (service.handleTurn as any).mockResolvedValue({ assistantText: 'Hi!' });

    const result = await controller.handleTurn(dto, mockUser);
    expect(service.handleTurn).toHaveBeenCalledWith('user_123', dto);
    expect(result).toEqual({ assistantText: 'Hi!' });
  });

  it('delegates endSession to VoiceService', async () => {
    const dto = { sessionId: 's_1' };
    (service.endSession as any).mockResolvedValue({ sessionId: 's_1', durationSeconds: 60 });

    const result = await controller.endSession(dto, mockUser);
    expect(service.endSession).toHaveBeenCalledWith('user_123', dto);
    expect(result).toEqual({ sessionId: 's_1', durationSeconds: 60 });
  });

  it('delegates getSessions to VoiceService', async () => {
    const query = { page: 1, limit: 10 };
    (service.getSessions as any).mockResolvedValue({ items: [], total: 0 });

    const result = await controller.getSessions(query, mockUser);
    expect(service.getSessions).toHaveBeenCalledWith('user_123', query);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('delegates deleteSession to VoiceService', async () => {
    (service.deleteSession as any).mockResolvedValue({ success: true });

    const result = await controller.deleteSession('s_1', mockUser);
    expect(service.deleteSession).toHaveBeenCalledWith('s_1', 'user_123');
    expect(result).toEqual({ success: true });
  });
});
