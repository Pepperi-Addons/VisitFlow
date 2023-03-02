
import { Injectable } from '@angular/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { IVisitFlow, IVisitFlowStep } from 'shared';
import { CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK,
         CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_GROUP_CLICK } from 'shared';
import _ from 'lodash';

@Injectable()
export class VisitDetailsService {
    private _visit: IVisitFlow | null = null;    
    private _accountUUID; 
    private _selectedGroup;   
        
    set visit(val: IVisitFlow) {
        this._visit = val;
    }

    set accountUUID(val: string) {
        this._accountUUID = val;
    }   

    get groups() {
        return this._visit.Groups;
    }   

    constructor(private _addonService: PepAddonService) {}    

    onStepClicked(selectedStep: any) {
        console.log('SelectedStep', selectedStep);
        this._addonService.emitEvent(CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK, {
            AccountUUID: this._accountUUID,
            Visit: this._visit,
            SelectedStep: selectedStep,
            SelectedGroup: this._selectedGroup            
        }).then(res => {
            console.log('res', res);
            if (res?.Status === 'failure') {
                console.log('Error:', res.Error);
            }
        });   
    }

    onGroupClicked(selectedGroup: any) {
        this._selectedGroup = selectedGroup;
        
        this._addonService.emitEvent(CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_GROUP_CLICK, {
            AccountUUID: this._accountUUID,
            Visit: this._visit,
            SelectedGroup: selectedGroup            
        }).then(res => {
            console.log('res', res);
            if (res?.Status === 'failure') {
                console.log('Error:', res.Error);
            }
        });   
    }
   
}

