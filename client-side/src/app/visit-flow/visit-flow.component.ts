import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VisitFlowService } from './visit-flow.service';
import { of } from 'rxjs';


@Component({
    selector: 'page-visit-flow',
    templateUrl: './visit-flow.component.html',
    styleUrls: ['./visit-flow.component.scss'],
    providers: [VisitFlowService]
})
export class VisitFlowComponent implements OnInit {
    @Input()
    set hostObject(value: any) {
        console.log('hostObject', value);   
        if (value?.pageParameters?.AccountUUID) {
            this._visitFlowService.accountUUID = value.pageParameters.AccountUUID;
            if (value?.configuration?.udcFlow) {
                this._visitFlowService.loadVisits(value.configuration.udcFlow)
                    .then(
                        res => {
                            console.log('res', res);
                            if (res?.visits) {
                                this._visitFlowService.visits = res.visits;
                            }
                        }
                    )
            } else {
                // no udc selected;
                this.errorMessage = 'No UDC selected';
            } 
        } else {
            //no account uuid
            this.errorMessage = 'No account selected';
        } 
        
    }

    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    get visits() {
        return this._visitFlowService.visits;
    }

    get selectedVisit() {
        return this._visitFlowService.selectedVisit;
    }
    
    errorMessage = '';

    constructor(private _visitFlowService: VisitFlowService) {
        //
    }

    ngOnInit(): void {
        //        
    }

    onVisitSelected(flow) {
        console.log('onFlowSelected', flow);
        this._visitFlowService.selectedVisit = flow;
    }   

}
