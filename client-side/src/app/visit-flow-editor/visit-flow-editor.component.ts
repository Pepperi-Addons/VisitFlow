import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VisitFlowEditorService } from './visit-flow-editor.service';

@Component({
    selector: 'visit-flow-editor',
    templateUrl: './visit-flow-editor.component.html',
    styleUrls: ['./visit-flow-editor.component.scss']
})
export class VisitFlowEditorComponent implements OnInit {    
    @Input()
    set hostObject(value: any) {
        console.log('hostObject', value?.configuration?.udcFlow);
        if (value?.configuration?.udcFlow) {
            this.selectedUdcFlow = value.configuration.udcFlow;            
        } else {
            this.selectedUdcFlow = '';
        }        
    }    

    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();    

    flows$;
    selectedUdcFlow = '';

    constructor(private _visitFlowEditorService: VisitFlowEditorService) {
    }

    ngOnInit(): void {
        this.flows$ = this._visitFlowEditorService.loadFlows();        
    }

    ngOnChanges(e: any): void {
    }  

    onUDCFlowSelect(selected: string) {
        console.log('onUDCFlowSelect', selected);

        this.hostEvents.emit({
            action: 'set-configuration',
            configuration: {
                udcFlow: selected
            }
        });

    }
  
}
