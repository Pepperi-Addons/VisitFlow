import { Pipe, PipeTransform } from '@angular/core';
import { IVisitFlowStep } from 'shared';

@Pipe({ name: 'isGroupLocked' })
export class GroupLockedPipe implements PipeTransform {
    transform(steps: IVisitFlowStep[]) {
        let allDisabled = true;
       // let allCompleted = true;                

        for (let step of steps) {
            if (!step.Disabled) {                
                allDisabled = false;                
            }    
            /*        
            if (!step.Completed) {
                allCompleted = false;;
            } */           
        }

        return allDisabled; /*|| allCompleted;*/      
    }
}