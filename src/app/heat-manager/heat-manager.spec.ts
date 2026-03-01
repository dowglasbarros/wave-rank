import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeatManager } from './heat-manager';

describe('HeatManager', () => {
  let component: HeatManager;
  let fixture: ComponentFixture<HeatManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatManager],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
