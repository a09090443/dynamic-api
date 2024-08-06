import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WsdlGenObjComponent } from './wsdl-gen-obj.component';

describe('WsdlGenObjComponent', () => {
  let component: WsdlGenObjComponent;
  let fixture: ComponentFixture<WsdlGenObjComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WsdlGenObjComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WsdlGenObjComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
