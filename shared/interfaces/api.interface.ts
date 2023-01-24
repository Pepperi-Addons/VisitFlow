import { AddonData, FindOptions } from '@pepperi-addons/papi-sdk';

export interface IApiService<T extends AddonData>
{
	getResources(findOptions: FindOptions): Promise<Array<T>>;

	getResourceByKey(key: string): Promise<T>;

    searchResources(body: any): Promise<Array<T>>;
}

export default IApiService;