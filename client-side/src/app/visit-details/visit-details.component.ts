import { Component, Input, OnInit } from '@angular/core';
import { IVisitFlow, IVisitFlowGroup, IVisitFlowStep } from 'shared';
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
    set visit(visit: IVisitFlow)  {
        console.log('visit', visit);
        this._visitDetailsService.visit = visit;
    }

    @Input() 
    set accountUUID(val: string) {
        this._visitDetailsService.accountUUID = val;
    };

    @Input() showReturn = false;
    
    get groups() {
        return this._visitDetailsService.groups;
    }

    selectedGroup: IVisitFlowGroup;

    constructor(
        private _visitDetailsService: VisitDetailsService,
        private _visitFlowService: VisitFlowService
    ) {
    }

    ngOnInit(): void {
        
    }
    
    onGroupClicked(group) {
        console.log('onGroupClicked', group);
        this.selectedGroup = group;
    }

    async onStepClicked(step: IVisitFlowStep) {
        console.log('onStepClicked', step);

        this._visitDetailsService.onStepClicked(step);                        
    }

    onReturnToVisitListClicked() {
        this._visitFlowService.selectedVisit = null;
    }    

    onReturnToGroupsClicked() {
        this.selectedGroup = null;
    }    
}