import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VocabularyController } from './vocabulary.controller.js';

describe('VocabularyController', () => {
  let controller: VocabularyController;
  let mockService: any;

  const mockUser = { userId: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    mockService = {
      lookup: vi.fn(),
      saveOccurrence: vi.fn(),
      findAll: vi.fn(),
      findOccurrences: vi.fn(),
      updateOccurrence: vi.fn(),
      deleteOccurrence: vi.fn(),
      deleteVocabularyItem: vi.fn(),
    };

    controller = new VocabularyController(mockService);
  });

  it('lookup should delegate to service.lookup', async () => {
    const dto = {
      selectedText: 'scale',
      contextText: 'We need to scale.',
    };
    mockService.lookup.mockResolvedValue({ lemma: 'scale', meaning: 'to grow' });

    const result = await controller.lookup(dto);
    expect(mockService.lookup).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ lemma: 'scale', meaning: 'to grow' });
  });

  it('saveOccurrence should delegate to service.saveOccurrence', async () => {
    const dto = {
      lemma: 'test',
      meaning: 'a procedure for critical evaluation',
      sentence: 'This is a test.',
      sourceUrl: 'https://example.com',
    };
    mockService.saveOccurrence.mockResolvedValue({ occurrenceId: 'occ-1' });

    const result = await controller.saveOccurrence(dto, mockUser);
    expect(mockService.saveOccurrence).toHaveBeenCalledWith(dto, 'user-123');
    expect(result).toEqual({ occurrenceId: 'occ-1' });
  });

  it('findAll should delegate to service.findAll', async () => {
    const query = { page: 1, limit: 10 };
    mockService.findAll.mockResolvedValue({ items: [], total: 0 });

    const result = await controller.findAll(mockUser, query);
    expect(mockService.findAll).toHaveBeenCalledWith('user-123', query);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('findOccurrences should delegate to service.findOccurrences', async () => {
    mockService.findOccurrences.mockResolvedValue({ occurrences: [] });

    const result = await controller.findOccurrences('item-1', mockUser);
    expect(mockService.findOccurrences).toHaveBeenCalledWith('user-123', 'item-1');
    expect(result).toEqual({ occurrences: [] });
  });

  it('deleteOccurrence should delegate to service.deleteOccurrence', async () => {
    mockService.deleteOccurrence.mockResolvedValue({ success: true });

    const result = await controller.deleteOccurrence('occ-1', mockUser);
    expect(mockService.deleteOccurrence).toHaveBeenCalledWith('user-123', 'occ-1');
    expect(result).toEqual({ success: true });
  });

  it('deleteVocabularyItem should delegate to service.deleteVocabularyItem', async () => {
    mockService.deleteVocabularyItem.mockResolvedValue({ success: true });

    const result = await controller.deleteVocabularyItem('item-1', mockUser);
    expect(mockService.deleteVocabularyItem).toHaveBeenCalledWith('user-123', 'item-1');
    expect(result).toEqual({ success: true });
  });
});
