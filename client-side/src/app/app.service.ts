import { Injectable } from '@angular/core';
import { PepAddonService, PepLoaderService, PepHttpService } from "@pepperi-addons/ngx-lib";


@Injectable({
    providedIn: 'root'
})
export class AppService {
    constructor(private _httpService: PepHttpService) {

    }


    getPapiCall(url: string) {
        return this._httpService.getPapiApiCall(url);
    }

    postPapiCall(url: string, body: any, headers: any = null) {
        return this._httpService.postPapiApiCall(url, body, headers);
    }
}