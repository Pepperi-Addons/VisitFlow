import { Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { filter, map } from 'rxjs/operators';
import { VISIT_FLOWS_BASE_TABLE_NAME } from 'shared';


@Injectable({
    providedIn: 'root'
})
export class VisitFlowEditorService {
    constructor(private _appService: AppService) {

    }
    
    loadFlows() {
        return this._appService.getPapiCall('/user_defined_collections/schemes').pipe(
            map(collections => collections
                .filter(collection => collection.Extends?.Name === VISIT_FLOWS_BASE_TABLE_NAME)
                .map(collection => {                    
                    return {
                        key: collection.Name,
                        value: collection.Name
                    }
                }))
        );
    }
}