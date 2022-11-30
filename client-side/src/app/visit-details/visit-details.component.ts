import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IVisitFlowActivityGroup, IVisitFlowActivity } from '../visit-flow/visit-flow.model';
import { VisitDetailsService } from './visit-details.service';
import { VisitFlowService } from '../visit-flow/visit-flow.service';

@Component({
    selector: 'visit-details',
    templateUrl: './visit-details.component.html',
    styleUrls: ['./visit-details.component.scss'],
    providers: [VisitDetailsService]
})
export class VisitDetailsComponent implements OnInit {
    @Input()
    set activities(list: IVisitFlowActivity[]) {
        console.log('activities', list);
        this._visitDetailsService.initGroups(list);
    };

    get groups() {
        return this._visitDetailsService.groups;
    }

    selectedGroup: IVisitFlowActivityGroup;

    constructor(
        private _visitDetailsService: VisitDetailsService,
        private _visitFlowService: VisitFlowService
    ) {
    }

    ngOnInit(): void {

    }

    initGroups(list: IVisitFlowActivity[]) {

    }

    onGroupClicked(group) {
        console.log('onGroupClicked', group);
        this.selectedGroup = group;
    }

    onActivityClicked(activity) {
        console.log('onActivityClicked', activity);
        //TODO - check how to fetch the activity uuid
        this._visitFlowService.handleActivityClicked(activity);
    }
}