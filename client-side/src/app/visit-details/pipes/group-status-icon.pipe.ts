import { Pipe, PipeTransform } from '@angular/core';
import { IVisitFlowActivity } from '../../visit-flow/visit-flow.model';

@Pipe({ name: 'groupStatusIcon' })
export class GroupStatusIcon implements PipeTransform {
    transform(activities: IVisitFlowActivity[]) {
        let allDisabled = false;
        let allCompleted = true;
        let incompletedMandatory = false;
        

        for (let activity of activities) {
            if (activity.Disabled) {                
                allDisabled = true;                
            }
            if (activity.Mandatory && activity.Completed !== activity.Status) {
                incompletedMandatory = true;
            }
            if (activity.Completed !== activity.Status) {
                allCompleted = false;;
            }            
        }
        //all the activities are disabled
        if (allDisabled) {
            return 'system_lock';
        }

        //there is a mandatory activity that is not completed 
        if (incompletedMandatory) {
            return 'system_alert';
        }

        //all the activities are completed
        if (allCompleted) {
            return 'system_ok';
        }
        return 'system_flag';
        /*
        //when all the activities are disabled
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
        if (!activities.filter(activity => activity.Completed !== activity.Status).length) {
            return 'system_ok';
        }
        return 'system_flag';*/

    }
}