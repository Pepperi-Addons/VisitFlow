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

    //selectedGroup: IVisitFlowGroup;
    selectedGroupIndex = -1;

    constructor(
        private _visitDetailsService: VisitDetailsService,
        private _visitFlowService: VisitFlowService
    ) {
    }

    ngOnInit(): void {
        
    }
    
    onGroupClicked(index: number) {
        console.log('onGroupClicked', index);
        //this.selectedGroup = group;
        this.selectedGroupIndex = index;
    }

    onStepClicked(index: number) {
        console.log('onStepClicked', this.groups[this.selectedGroupIndex].Steps[index]);
        let selectedStep = {
            GroupIndex: this.selectedGroupIndex,
            StepIndex: index
        };
        this._visitDetailsService.onStepClicked(selectedStep);                        
    }

    onReturnToVisitListClicked() {
        this._visitFlowService.selectedVisit = null;
    }    

    onReturnToGroupsClicked() {
        //this.selectedGroup = null;
        this.selectedGroupIndex = -1;

    }    
}