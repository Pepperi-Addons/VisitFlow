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
        console.log('hostObject', value?.configuration?.resourceName);
        if (value?.configuration?.resourceName) {
            this.selectedResourceName = value.configuration.resourceName;            
        } else {
            this.selectedResourceName = '';
        }        
    }    

    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();    

    flows$;
    selectedResourceName = '';

    constructor(private _visitFlowEditorService: VisitFlowEditorService) {
    }

    ngOnInit(): void {
        this.flows$ = this._visitFlowEditorService.loadFlows();        
    }

    ngOnChanges(e: any): void {
    }  

    onUDCResourceSelect(selected: string) {
        console.log('onUDCResourceSelect', selected);

        this.hostEvents.emit({
            action: 'set-configuration',
            configuration: {
                resourceName: selected
            }
        });

    }
  
}
