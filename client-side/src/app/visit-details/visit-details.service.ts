
import { Injectable } from '@angular/core';
import { IVisitFlowActivityGroup, IVisitFlowActivity } from '../visit-flow/visit-flow.model';
import _ from 'lodash';

@Injectable()
export class VisitDetailsService {
    private _groups: IVisitFlowActivityGroup[] = [];

    get groups() {
        return this._groups;
    }

    initGroups(activities: IVisitFlowActivity[]) {
        this._groups = _(activities)
            .groupBy(activity => activity.Group)
            .sortBy(group => activities.indexOf(group[0]))
            .map(group => {
                return {
                    name: group[0].Group,                    
                    activities: group
                }
            })
            .value();        
    }
}

