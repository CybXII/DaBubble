import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadmessagesComponent } from './threadmessages.component';

describe('ThreadmessagesComponent', () => {
  let component: ThreadmessagesComponent;
  let fixture: ComponentFixture<ThreadmessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadmessagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreadmessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
