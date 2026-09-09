import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BettingHouses } from './betting-houses';

describe('BettingHouses', () => {
  let component: BettingHouses;
  let fixture: ComponentFixture<BettingHouses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BettingHouses],
    }).compileComponents();

    fixture = TestBed.createComponent(BettingHouses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
