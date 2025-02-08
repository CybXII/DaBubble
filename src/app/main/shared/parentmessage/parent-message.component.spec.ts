import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentMessageComponent } from './parent-message.component';

describe('ParentmessageComponent', () => {
  let component: ParentMessageComponent;
  let fixture: ComponentFixture<ParentMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
