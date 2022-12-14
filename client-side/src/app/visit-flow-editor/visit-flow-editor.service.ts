import { Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { filter, map } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class VisitFlowEditorService {
    constructor(private _appService: AppService) {

    }

    //TODO - get scheme name from shared folder
    loadFlows() {
        return this._appService.getPapiCall('/user_defined_collections/schemes').pipe(
            map(collections => collections
                .filter(collection => collection.Extends?.Name === 'visitFlows')
                .map(collection => {                    
                    return {
                        key: collection.Name,
                        value: collection.Name
                    }
                }))
        );
    }
}