import { Pipe, PipeTransform } from '@angular/core';
import { IVisitFlowStep } from 'shared';

@Pipe({ name: 'stepStatusIcon' })
export class StepStatusIconPipe implements PipeTransform {
    transform(step: IVisitFlowStep) {
        if (step.Disabled) {
            return 'system_lock';
        }
        if (step.Mandatory && !step.Completed) {
            return 'system_must';
        }
        if (step.Completed) {
            return 'system_ok';
        }
        return 'system_flag';        
    }
}