import { TestBed } from '@angular/core/testing';

import { SaveEditMessageService } from './save-edit-message.service';

describe('SaceEditMessageService', () => {
  let service: SaveEditMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SaveEditMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
