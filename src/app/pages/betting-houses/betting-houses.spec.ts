import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CasasDeApostas } from './casas-de-apostas';

describe('CasasDeApostas', () => {
  let component: CasasDeApostas;
  let fixture: ComponentFixture<CasasDeApostas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasasDeApostas],
    }).compileComponents();

    fixture = TestBed.createComponent(CasasDeApostas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
