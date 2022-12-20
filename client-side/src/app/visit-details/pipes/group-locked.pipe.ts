import { Pipe, PipeTransform } from '@angular/core';
import { IVisitFlowActivity } from '../../visit-flow/visit-flow.model';

@Pipe({ name: 'isGroupLocked' })
export class GroupLockedPipe implements PipeTransform {
    transform(activities: IVisitFlowActivity[]) {
        let allDisabled = true;
        let allCompleted = true;                

        for (let activity of activities) {
            if (!activity.Disabled) {                
                allDisabled = false;                
            }            
            if (!activity.Completed) {
                allCompleted = false;;
            }            
        }

        return allDisabled || allCompleted;        

    }
}