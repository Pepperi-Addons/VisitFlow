import { Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { map } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class VisitFlowEditorService {
    constructor(private _appService: AppService) {

    }

    loadFlows() {
        return this._appService.getPapiCall('/user_defined_collections/schemes').pipe(
            map(collections => collections.map(collection => {
                return {
                    key: collection.Name,
                    value: collection.Name
                }
            })) 
        );
    }
}