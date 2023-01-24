import { ADALGetParams } from "@pepperi-addons/client-api";
import { FindOptions } from "@pepperi-addons/papi-sdk";
import config from '../addon.config.json'

export class PapiService {    
    constructor() {}

    async getResources(options: FindOptions): Promise<Array<any>>
	{
		throw new Error("Method not implemented.");
	}

	async getResourceByKey(resourceName: string, key: any): Promise<any>
	{
        const adalGetParams: ADALGetParams = {
            addon: config.AddonUUID,
            table: resourceName,
            key: key
        };
        return await (pepperi.api.adal.get(adalGetParams) as unknown as Promise<any>);		
	}
	
	async searchResources(body: any): Promise<Array<any>>
	{
		throw new Error("Method not implemented.");
	}
}