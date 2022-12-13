
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, errorMessage:{the reason why it is false}}
The error Message is important! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server';
import { RelationsService } from './services/relations.service';
import { PapiClient, AddonDataScheme } from '@pepperi-addons/papi-sdk'
import { ActivityType, VisitFlowTSAFields } from './metadata';
import { FlowService } from './services/flow.service';

export async function install(client: Client, request: Request): Promise<any> {
    try {
        /*
        const papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        }); */

        const flowService = new FlowService(client);
        //create 3 abstracts shcemas (without steps field)
        await flowService.createSchemas();
        //create 3 udcs - 
        // 1 - Steps - that inherits from Steps shcema (from type contained)
        // 2 - Flows inherits from Flows shcema with property of name steps (array of type contained resource for resource = Steps)
        // 3 - Groups that inherit from Groups shcema 
        await flowService.upsertUDCs(); 

        const type = await flowService.createATD();
        //const type = await createATD(papiClient);
        if (type?.TypeID) {
            //await createTSAFields(type.TypeID, papiClient);
            await flowService.createTSAFields(type.TypeID);
        }
        const service = new RelationsService(client);
        await service.upsertRelations();

    } catch (err) {
        throw new Error(`Failed to install addon. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    try {
        //
        //const flowService = new FlowService(client);        
        //await flowService.createSchemas();
        //await flowService.upsertUDCs(); 
        /*
        const type = await flowService.createATD();        
        if (type?.TypeID) {            
            await flowService.createTSAFields(type.TypeID);
        }
        */
        const service = new RelationsService(client);
        await service.upsertRelations();
    } catch (err) {
        throw new Error(`Failed to upgrade addon. error - ${err}`);
    }

    return { success: true, resultObject: {} }
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
}

/*
async function createGroupSchema(papiClient: PapiClient, client: Client) {
    const schema: AddonDataScheme = {
        Name: '',
        Type: 'abstract',
        AddonUUID: client.AddonUUID,
        Fields: {
            Title: 
            {
                Type: 'String'
            },
            SortIndex:
            {
                Type: 'Integer'
            }
        }        
    }

    await papiClient.addons.data.schemes.post(schema);
}

async function createATD(papiClient: PapiClient) {
    const url = `/meta_data/activities/types`;
    return await papiClient.post(url, ActivityType);
}

async function createTSAFields(atdId: string, papiClient: PapiClient) {
    const bulkUrl = `/meta_data/bulk/activities/types/${atdId}/fields`;
    return await papiClient.post(bulkUrl, VisitFlowTSAFields);
} 
*/
