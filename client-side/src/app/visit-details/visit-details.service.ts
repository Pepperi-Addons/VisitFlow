
import { Injectable } from '@angular/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { IVisitFlow, IVisitFlowStep } from 'shared';
import { CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK } from 'shared';
import _ from 'lodash';

@Injectable()
export class VisitDetailsService {
    private _visit: IVisitFlow | null = null;    
    private _accountUUID;    
        
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
            SelectedStep: selectedStep            
        }).then(res => {
            console.log('res', res);
            if (res?.Status === 'failure') {
                console.log('Error:', res.Error);
            }
        });   
    }
   
}

