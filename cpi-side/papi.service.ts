//import { ADALGetParams } from "@pepperi-addons/client-api";
import { FindOptions } from "@pepperi-addons/papi-sdk";
import config from '../addon.config.json'

export class PapiService {    
    constructor(protected resourceName: string) {}

    async getResources(options: FindOptions): Promise<Array<any>>
	{
		throw new Error("Method not implemented.");
	}

	async getResourceByKey(key: any): Promise<any>
	{   
		return await pepperi.addons.data.uuid(config.AddonUUID).table(this.resourceName).key(key).get();
	}
	
	async searchResources(body: any): Promise<{Objects: any[], Count?: number}>
	{
		return await (pepperi.addons.data.uuid(config.AddonUUID).table(this.resourceName).search(body) as Promise<{Objects: any[], Count?: number}>);
	}
}