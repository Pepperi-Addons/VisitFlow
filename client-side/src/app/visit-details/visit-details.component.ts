import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { IVisitFlow, IVisitFlowActivityGroup, IVisitFlowActivity } from '../visit-flow/visit-flow.model';
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
        console.log('activities 2', list);
      //  this._visitDetailsService.initGroups(list);
    };

    
    @Input()
    set visit(visit: IVisitFlow)  {
        console.log('visit', visit);
        this._visitDetailsService.initVisit(visit);
    }

    @Input() showReturn = false;

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

    async onActivityClicked(activity) {
        console.log('onActivityClicked', activity);
        let url = '';//TEMP
        if (activity.Starter && !this._visitDetailsService.isInProgress) {
            url = await this._visitDetailsService.handleVisitStartActivityClicked(activity);
        } else {
            url = await this._visitDetailsService.handleActivityClicked(activity);
        }
        
        console.log('url', url);
        if (url) {
            //navigate
        }
        //TODO - check how to fetch the activity uuid
       // this._visitDetailsService.handleActivityClicked(activity);
    }

    onReturnClicked() {
        this._visitFlowService.selectedVisit = null;
    }    
}