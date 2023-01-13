import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VisitFlowService } from './visit-flow.service';
import { of } from 'rxjs';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';


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
            this._visitFlowService.accountUUID = value.pageParameters.AccountUUID;;
        }
        let resourceName = '';
        if (value?.configuration?.udcFlow) { //TEMP - change to resourceName input
            resourceName = value?.configuration?.udcFlow;
        }
        this._visitFlowService.loadVisits(resourceName)
            .then(
                res => {
                    if (res?.Visits?.length) {
                        this._visitFlowService.visits = res.Visits;
                    }
                }
            )
        
    }

    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    get visits() {
        return this._visitFlowService.visits;
    }

    get selectedVisit() {
        return this._visitFlowService.selectedVisit;
    }

    get accountUUID() {
        return this._visitFlowService.accountUUID;
    }

    errorMessage = '';

    constructor(private _visitFlowService: VisitFlowService, public layoutService: PepLayoutService) {
        this.layoutService.onResize$.subscribe((size: PepScreenSizeType) => {
            console.log('on screen changed', size);
        });
        //
    }

    ngOnInit(): void {
        //        
    }

    onVisitSelected(flow) {
        //console.log('onFlowSelected', flow);
        this._visitFlowService.selectedVisit = flow;
    }

}
