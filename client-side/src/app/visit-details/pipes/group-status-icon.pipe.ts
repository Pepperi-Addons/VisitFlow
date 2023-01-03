import { Pipe, PipeTransform } from '@angular/core';
import { IVisitFlowStep } from 'shared';

@Pipe({ name: 'groupStatusIcon' })
export class GroupStatusIconPipe implements PipeTransform {
    transform(steps: IVisitFlowStep[]) {
        let allDisabled = true;
        let allCompleted = true;
        let incompletedMandatory = false;
        
        for (let step of steps) {
            if (!step.Disabled) {                
                allDisabled = false;                
            }
            if (step.Mandatory && !step.Completed) {
                incompletedMandatory = true;
            }
            if (!step.Completed) {
                allCompleted = false;;
            }            
        }
        //all the steps are disabled
        if (allDisabled) {
            return 'system_lock';
        }

        //there is a mandatory step that is not completed 
        if (incompletedMandatory) {
            return 'system_alert';
        }

        //all the steps are completed
        if (allCompleted) {
            return 'system_ok';
        }
        return 'system_flag';        

    }
}