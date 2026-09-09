import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterBet } from './register-bet';

describe('RegisterBet', () => {
  let component: RegisterBet;
  let fixture: ComponentFixture<RegisterBet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterBet],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterBet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
