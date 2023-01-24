import { Client } from '@pepperi-addons/debug-server/dist';
import { AddonData, FindOptions, PapiClient } from '@pepperi-addons/papi-sdk';
import { IApiService } from 'shared/interfaces/api.interface';

export class PapiService<T extends AddonData> implements IApiService<T>
{
	constructor(private papiClient: PapiClient, private client: Client, private resourceName: string) 
	{}

	async getResources(findOptions: FindOptions): Promise<Array<T>>
	{
		return await (this.papiClient.addons.data.uuid(this.client.AddonUUID).table(this.resourceName).find(findOptions) as Promise<Array<T>>);
	}

	async getResourceByKey(key: any): Promise<T>
	{
		return await (this.papiClient.addons.data.uuid(this.client.AddonUUID).table(this.resourceName).key(key).get() as Promise<T>);
	}
	
	async searchResources(body: any): Promise<Array<T>>
	{
		return await (this.papiClient.post(`/addons/data/search/${this.client.AddonUUID}/${this.resourceName}`, body) as Promise<Array<T>>);
	}
}

export default PapiService;