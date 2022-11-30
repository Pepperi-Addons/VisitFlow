import { Pipe, PipeTransform } from '@angular/core';
import { IVisitFlowActivity } from '../../visit-flow/visit-flow.model';

@Pipe({ name: 'groupStatusIcon' })
export class GroupStatusIcon implements PipeTransform {
    transform(activities: IVisitFlowActivity[]) {
        //when all the ctivities are disabled
        if (activities.filter(activity => activity.Enabled === false).length === activities.length) {
            return 'system_lock';
        }
        //when there is a mandatory activity that is not completed        
        let attention = false;
        for (let activity of activities) {
            if (activity.Mandatory && activity.Completed !== activity.Status) {
                attention = true;
                break;
            }
        }
        if (attention) {
            return 'system_alert';
        }
        //done when all the activities are completed
        if (activities.filter(activity => activity.Completed !== activity.Status).length) {
            return 'system_ok';
        }
        return 'system_flag';

    }
}