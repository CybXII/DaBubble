import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesclearComponent } from './messagesclear.component';

describe('MessagesclearComponent', () => {
  let component: MessagesclearComponent;
  let fixture: ComponentFixture<MessagesclearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesclearComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessagesclearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
