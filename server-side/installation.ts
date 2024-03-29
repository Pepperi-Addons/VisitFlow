
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, errorMessage:{the reason why it is false}}
The error Message is important! it will be written in the audit log and help the user to understand what happen.
*/

import { Client, Request } from '@pepperi-addons/debug-server';
import { RelationsService } from './services/relations.service';
import { PapiClient, AddonDataScheme } from '@pepperi-addons/papi-sdk'
import { ActivityType, VisitFlowTSAFields } from './metadata';
import { FlowService } from './services/flow.service';

export async function install(client: Client, request: Request): Promise<any> {
    try {
        const relationService = new RelationsService(client);
        await relationService.upsetRelationAndScheme(true);        

    } catch (err: any) {
        throw new Error(`Failed to install addon. error - ${err.message}`);
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    try {              
        const relationService = new RelationsService(client);
        await relationService.upsetRelationAndScheme(false);
    } catch (err: any) {
        throw new Error(`Failed to upgrade addon. error - ${err.message}`);
    }

    return { success: true, resultObject: {} }
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
}

