import { Pipe, PipeTransform } from '@angular/core';
import { IVisitFlowActivity } from '../../visit-flow/visit-flow.model';

@Pipe({ name: 'activityStatusIcon' })
export class ActivityStatusIcon implements PipeTransform {
    transform(activitiy: IVisitFlowActivity) {
        if (!activitiy.Enabled) {
            return 'system_lock';
        }
        if (activitiy.Mandatory) {
            return 'system_alert';
        }
        if (activitiy.Completed === activitiy.Status) {
            return 'system_ok';
        }
        return 'system_flag';        
    }
}