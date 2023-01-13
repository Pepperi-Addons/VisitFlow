import { Injectable } from '@angular/core';
import _ from 'lodash';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_LOAD } from 'shared';


@Injectable()
export class VisitFlowService {
    private _visits: any[] = [];
    private _selectedVisit: {} | null = null;    
    private _accountUUID = '';

    set accountUUID(val: string) {
        this._accountUUID = val;
    }

    get accountUUID() {
        return this._accountUUID;
    }
    set visits(list: any[]) {
        this._visits = list;       
    }

    get visits() {
        return this._visits;
    }

    set selectedVisit(value) {
        this._selectedVisit = value;
    }

    get selectedVisit() {
        return this._selectedVisit;
    }

    constructor(private _addonService: PepAddonService) {
        //
    }

    loadVisits(resourceName: string) {
        console.log('loadVisits', resourceName);
        console.log('this._accountUUID', this._accountUUID);
        return this._addonService.emitEvent(CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_LOAD, {
            ResourceName: resourceName,
            AccountUUID: this._accountUUID
        });
    }    
    
}