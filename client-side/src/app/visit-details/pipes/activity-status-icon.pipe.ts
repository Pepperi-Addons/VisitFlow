import { Pipe, PipeTransform } from '@angular/core';
import { IVisitFlowActivity } from '../../visit-flow/visit-flow.model';

@Pipe({ name: 'activityStatusIcon' })
export class ActivityStatusIconPipe implements PipeTransform {
    transform(activity: IVisitFlowActivity) {
        if (activity.Disabled) {
            return 'system_lock';
        }
        if (activity.Mandatory && !activity.Completed) {
            return 'system_must';
        }
        if (activity.Completed) {
            return 'system_ok';
        }
        return 'system_flag';        
    }
}