import { Client, Request } from '@pepperi-addons/debug-server';
import { ApiFieldObject, PapiClient, AddonDataScheme, SchemeFieldTypes } from "@pepperi-addons/papi-sdk";
import { VISIT_FLOWS_BASE_TABLE_NAME } from 'shared';
import { IApiService } from'shared/interfaces/api.interface';
import { PapiService } from './papi.service';

export class VisitFlowApiService {
    private _papiClient: PapiClient;
    private _client: Client; 
    private _request: Request; 

    constructor(client: Client, request: Request) {
        this._client = client;
        this._papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
        this._request = request;
    }


    getResourceService(resouceName: string) {
        return new PapiService(this._papiClient, this._client, resouceName);        
    }

    buildFinOptionsQuery() {
        return {
            ...(this._request.query.fields && {fields: this._request.query.fields.split(',')}),
			...(this._request.query.where && {where: this._request.query.where}),
			...(this._request.query.order_by && {order_by: this._request.query.order_by}),
			...(this._request.query.page && {page: this._request.query.page}),
			...(this._request.query.page_size && {page_size: this._request.query.page_size}),
			...(this._request.query.include_deleted && {include_deleted: this._request.query.include_deleted})
        }
    }
}