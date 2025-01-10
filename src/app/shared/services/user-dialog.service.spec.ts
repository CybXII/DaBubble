import { TestBed } from '@angular/core/testing';

import { UserDialogService } from './user-dialog.service';

describe('UserDialogService', () => {
  let service: UserDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
