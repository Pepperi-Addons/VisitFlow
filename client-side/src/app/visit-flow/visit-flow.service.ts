import { Injectable, ɵɵsetComponentScope } from '@angular/core';
import { IVisitFlowActivity, VisitFlowActivityType } from './visit-flow.model';
import { AppService } from '../app.service';
import _ from 'lodash';
import { map, tap, catchError } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { PepAddonService } from '@pepperi-addons/ngx-lib';


@Injectable()
export class VisitFlowService {    
    private _visits: any[] = [];
    private _selectedVisit: {} | null = null; 
    private _visitCreationDateTime: string | null = null;
    private _accountUUID = '';//61a891db-1252-4043-be81-0e4e874d7385' //TODO get from pageParams of account home page
  
    set accountUUID(val: string) {
        this._accountUUID = val;
    }

    set visits(list: any[]) {
        this._visits = list;

        if (list.length === 1 && list[0].InProgress) {
            this._visitCreationDateTime = list[0].VisitCreationDateTime;
        }
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

    loadVisits(collection: string) {
        console.log('loadVisits', collection);
        console.log('this._accountUUID', this._accountUUID);
        return this._addonService.emitEvent('OnClientVisitsLoad', {
            Collection: collection,
            AccountUUID: this._accountUUID
        });
    }

    /*
    private getActivityUrl(id: string) {
        if (id) {
            if (id.indexOf('GA') > -1) {
                //const param = id.replace('GA_', '');
                const param = 'ce41efae-0c09-47b0-9de8-225d1e5f1ec1';
                return `/activities/details/${param}`;
            }
            if (id.indexOf('OA') > -1) {
                //const param = id.replace('OA_', '');
                const param = 'ce41efae-0c09-47b0-9de8-225d1e5f1ec1';
                return `/activities/details/${param}`;
            }
            if (id.indexOf('SRV') > -1) {
                //const param = id.replace('SRV_', '');
                const param = 'ce41efae-0c09-47b0-9de8-225d1e5f1ec1';
                return `/activities/details/${param}`;
            }
        }

        return null;
    } */

}