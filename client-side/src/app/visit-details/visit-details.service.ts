
import { Injectable } from '@angular/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { IVisitFlow, IVisitFlowActivityGroup, IVisitFlowActivity } from '../visit-flow/visit-flow.model';
import _ from 'lodash';

@Injectable()
export class VisitDetailsService {
    private _key: string | null = null;
    private _isInProgress = false;
    private _creationDateTime: string | null = null;
    private _accountUUID = '61a891db-1252-4043-be81-0e4e874d7385';

    //private _visit: IVisitFlow | undefined = undefined;
    private _groups: IVisitFlowActivityGroup[] = [];
    //private _visitCreationDateTime: string | null = null;

    get groups() {
        return this._groups;
    }

    get isInProgress() {
        return this._isInProgress;
    }

    constructor(private _addonService: PepAddonService) {}

    initVisit(visit: IVisitFlow) {
        this._key = visit.Key;
        this._isInProgress = visit.InProgress;
        if (!visit.InProgress) {
            this.lockActivities(visit.Activities);
        }
        this._creationDateTime = visit.CreationDateTime;
        this._groups = this.initGroups(visit.Activities);
        //console.log('after initVisit', this._groups);
    }
    
    handleVisitStartActivityClicked(activity: IVisitFlowActivity) {
        this._addonService.emitEvent('OnClientStartVisitClick', {
            AccountUUID: this._accountUUID,
            VisitUUID: this._key
        });  
    }

    handleActivityClicked(activity: IVisitFlowActivity) {        
        this._addonService.emitEvent('OnClientVisitActivityClick', {
            AccountUUID: this._accountUUID,
            ResourceType: activity.ResourceType,
            ResourceTypeID: activity.ResourceTypeID,
            CreationDateTime: this._creationDateTime
        });        
    }

    /**
     * lock all activities except start visit activity in case the visit isn't started
     * @param activities 
     */
    private lockActivities(activities: IVisitFlowActivity[]) {
        for(let activity of activities) {
            if (!activity.Starter) {
                activity.Disabled = true;
            }
        }
    }

    private initGroups(activities: IVisitFlowActivity[]) {
        return _(activities)
            .groupBy(activity => activity.Group)
            .sortBy(group => activities.indexOf(group[0]))
            .map(group => {
                return {
                    Name: group[0].Group,
                    Activities: group
                }
            })
            .value();
    }
}

