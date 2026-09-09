import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroDeAposta } from './registro-de-aposta';

describe('RegistroDeAposta', () => {
  let component: RegistroDeAposta;
  let fixture: ComponentFixture<RegistroDeAposta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroDeAposta],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroDeAposta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
