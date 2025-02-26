import { TestBed } from '@angular/core/testing';

import { EmojiStorageService } from './emoji-storage.service';

describe('EmojiStorageService', () => {
  let service: EmojiStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmojiStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
