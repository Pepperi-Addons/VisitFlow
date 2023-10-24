import { PapiClient, InstalledAddon, Relation } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { FlowService } from './flow.service';
import { 
    VISIT_FLOWS_TABLE_NAME,
    VISIT_FLOWS_BASE_TABLE_NAME, 
    CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK
} from 'shared';

export const JOURNEY_EVENTS_RELATION_NAME = 'JourneyEvent'

export class RelationsService {
    //private _client: Client;
    private _papiClient: PapiClient
    bundleFileName = '';
    addonUUID: string;

    constructor(private client: Client) {
        //this._client = client;
        this._papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
        
        this.addonUUID = client.AddonUUID;
        this.bundleFileName = `file_${this.client.AddonUUID}`;
    }

    // TODO: Add Journey code when needed.
    // private async upsertEventsRelation(eventName, displayEventName, fields) {
    //     const relation = {
    //         Type: "AddonAPI",
    //         AddonUUID: this.addonUUID,
    //         DisplayEventName: displayEventName,
    //         RelationName: JOURNEY_EVENTS_RELATION_NAME,
    //         Name: eventName,
    //         Description: "",
    //         AddonRelativeURL: `/event_filters/get_filter_by_event?event=${eventName}`,
    //         Fields: fields,
    //     };

    //     await this.upsertRelation(relation);
    // }

    // TODO: Add Journey code when needed.
    // private async upsertJourneyEventsRelation() {
    //     const promises = [
    //         this.upsertEventsRelation(CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK, "Visit flow step click", [{"FieldID": "Visits.Key"}, {"FieldID": "SelectedStep.GroupIndex"}, {"FieldID": "SelectedStep.StepIndex"}]),
    //     ];
    //     Promise.all(promises);
    // }

    async upsetRelationAndScheme(install = true) {
        try {
            await this.createSchemeTables(install);
            await this.upsertUserEventsRelation();
            await this.upsertBlockRelation('VisitFlow', true);
            // await this.upsertJourneyEventsRelation();
        } 
        catch (err: any) {
            throw new Error(err.message);
        }
    }

    private async createSchemeTables(install) {
        try {
            const flowService = new FlowService(this.client);              
            const type = await flowService.createATD();   
                
            if (type?.TypeID) {         
                await flowService.createTSAFields(type.TypeID);
                await flowService.createSchemas();  
                // remove this code ,after talking with Roi, he told me that we don't need to add UDCS here.      
                if(install){
                    await flowService.upsertUDCs();
                }
            }    
        } catch (err: any) {
            throw new Error(err.message);
        }            
    } 

    // For page block template
    private async upsertRelation(relation): Promise<any> {
        return await this._papiClient.post('/addons/data/relations', relation);
    }

    private getCommonRelationProperties(
        relationName: 'SettingsBlock' | 'PageBlock' | 'AddonBlock', 
        blockRelationName: string,
        blockRelationDescription: string,
        blockName: string
    ): Relation {
        return {
            RelationName: relationName,
            Name: blockRelationName,
            Description: blockRelationDescription,
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: this.client.AddonUUID,
            AddonRelativeURL: this.bundleFileName,
            ComponentName: `${blockName}Component`, // This is should be the block component name (from the client-side)
            ModuleName: `${blockName}Module`, // This is should be the block module name (from the client-side)
            ElementsModule: 'WebComponents',
            ElementName: `${blockName.toLocaleLowerCase()}-element-${this.client.AddonUUID}`,
        };
    }

    private async upsertSettingsRelation(blockRelationSlugName: string, blockRelationGroupName: string, blockRelationName: string, blockRelationDescription: string) {
        const blockName = 'Settings';

        const blockRelation: Relation = this.getCommonRelationProperties(
            'SettingsBlock',
            blockRelationName,
            blockRelationDescription,
            blockName);

        blockRelation['SlugName'] = blockRelationSlugName;
        blockRelation['GroupName'] = blockRelationGroupName;
        
        return await this.upsertRelation(blockRelation);
    }

    private async upsertUserEventsRelation() {
        const userEventsRelation: Relation = {
            RelationName: "UDCEvents",
            Name: VISIT_FLOWS_BASE_TABLE_NAME,
            Description: `The user events`,
            Type: "AddonAPI",
            AddonUUID: this.client.AddonUUID,
            AddonRelativeURL: '/api/visit_flow_user_events',
        }; 
        
        await this.upsertRelation(userEventsRelation);
    }

    private async upsertBlockRelation(blockRelationName: string, isPageBlock: boolean): Promise<any> {
        const blockName = 'Block';

        const blockRelation: Relation = this.getCommonRelationProperties(
            isPageBlock ? 'PageBlock' : 'AddonBlock',
            blockRelationName,
            `${blockRelationName} block`,
            blockName);

        // For Page block we need to declare the editor data.
        if (isPageBlock) {
            blockRelation['EditorComponentName'] = `${blockName}EditorComponent`; // This is should be the block editor component name (from the client-side)
            blockRelation['EditorModuleName'] = `${blockName}EditorModule`; // This is should be the block editor module name (from the client-side)}
            blockRelation['EditorElementName'] = `${blockName.toLocaleLowerCase()}-editor-element-${this.client.AddonUUID}`;
        }
        
        return await this.upsertRelation(blockRelation);
    }

    async upsertRelations() {
        // For settings block use this.
        // const blockRelationSlugName = 'CHANGE_TO_SETTINGS_SLUG_NAME';
        // const blockRelationGroupName = 'CHANGE_TO_SETTINGS_GROUP_NAME';
        // const blockRelationName = 'CHANGE_TO_SETTINGS_RELATION_NAME';
        // const blockRelationDescription = 'CHANGE_TO_SETTINGS_DESCRIPTION';
        // await this.upsertSettingsRelation(blockRelationSlugName, blockRelationGroupName, blockRelationName, blockRelationDescription);

        // For page block use this.
        // // TODO: change to block name (this is the unique relation name and the description that will be on the block).
        //const blockRelationName = 'VisitFlow';
        await this.upsertBlockRelation(VISIT_FLOWS_TABLE_NAME, true);

        // For addon block use this.
        // // TODO: change to block name (this is the unique relation name and the description that will be on the block).
        // const blockRelationName = 'CHANGE_TO_BLOCK_RELATION_NAME';
        // await this.upsertBlockRelation(blockRelationName, false);
    }
}