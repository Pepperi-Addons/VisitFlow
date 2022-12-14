
import { Client, Request } from '@pepperi-addons/debug-server';
import { ApiFieldObject, PapiClient, AddonDataScheme, SchemeFieldTypes } from "@pepperi-addons/papi-sdk";
import { ActivityType, VisitFlowTSAFields } from '../metadata';
import { 
    VISIT_FLOW_STEPS_TABLE_NAME, 
    VISIT_FLOW_STEPS_BASE_TABLE_NAME,
    VISIT_FLOW_GROUPS_TABLE_NAME,
    VISIT_FLOW_GROUPS_BASE_TABLE_NAME,
    VISIT_FLOWS_TABLE_NAME,
    VISIT_FLOWS_BASE_TABLE_NAME,
    USER_ACTION_ON_VISIT_FLOW_LOAD,
    USER_ACTION_ON_VISIT_FLOW_STEP_CLICK
} from 'shared';

export class FlowService {
    private _papiClient: PapiClient;
    private _client: Client;    

    constructor(client: Client) {
        this._client = client;
        this._papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
    }

    async createSchemas() {

        const flowsScheme = this.getFlowsSchema();
        const groupsScheme = this.getGroupsSchema();
        const stepsScheme = this.getStepsSchema();

        return Promise.all([
            this._papiClient.addons.data.schemes.post(flowsScheme),
            this._papiClient.addons.data.schemes.post(groupsScheme),
            this._papiClient.addons.data.schemes.post(stepsScheme)
        ]);
    }

    private getFlowsSchema(): AddonDataScheme {
        return {
            Name: VISIT_FLOWS_BASE_TABLE_NAME,
            Type: 'abstract',
            AddonUUID: this._client.AddonUUID,
            Fields: {
                Name:
                {
                    Type: 'String'
                },
                Description:
                {
                    Type: 'String'
                },
                Active:
                {
                    Type: 'Bool'
                }
            }
        }
    }

    private getGroupsSchema(): AddonDataScheme {
        return {
            Name: VISIT_FLOW_GROUPS_BASE_TABLE_NAME,
            Type: 'abstract',
            AddonUUID: this._client.AddonUUID,
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
    }

    private getStepsSchema(): AddonDataScheme {
        return {
            Name: VISIT_FLOW_STEPS_BASE_TABLE_NAME,
            Type: 'abstract',
            AddonUUID: this._client.AddonUUID,
            Fields: {
                Title:
                {
                    Type: 'String'
                },
                Group:
                {
                    Type: 'Resource',
                    Resource: VISIT_FLOW_GROUPS_BASE_TABLE_NAME,
                    AddonUUID: this._client.AddonUUID
                },
                ResourceType:
                {
                    Type: 'String'
                },
                ResourceTypeID:
                {
                    Type: 'String'
                },
                Mandatory:
                {
                    Type: 'Bool'
                },
                Completed:
                {
                    Type: 'String'
                }
            }
        }
    }

    async upsertUDCs() {
        const stepsScheme = this.getStepsUdcSchema();
        await this._papiClient.userDefinedCollections.schemes.upsert(stepsScheme)  
        const flowsScheme = this.getFlowsUdcSchema();
        const groupsScheme = this.getGroupsUdcSchema();
        
        return Promise.all([
            this._papiClient.userDefinedCollections.schemes.upsert(flowsScheme),
            this._papiClient.userDefinedCollections.schemes.upsert(groupsScheme)
        ]);     
    }

    /**
     * upserts a UDC scheme that inherits from visitFlow scheme and contains an additional 'steps' 
     * field of type 'ContainedResource'
     * @returns udc scheme
     */
    private getFlowsUdcSchema(): any {        
        const udcObject = {
            DocumentKey: {
                Delimiter: '@',
                Type: 'AutoGenerate',
                Fields: []
            },
            Fields: {
                steps: {
                    AddonUUID: this._client.AddonUUID,
                    Description: 'steps',
                    Indexed: false,
                    IndexedFields: {},
                    Items: {
                        AddonUUID: this._client.AddonUUID,
                        Description: '',
                        Mandatory: false,
                        Resource: VISIT_FLOW_STEPS_TABLE_NAME,
                        Type: 'ContainedResource'
                    },
                    Mandatory: false,
                    OptionalValues: [],
                    Resource: VISIT_FLOW_STEPS_TABLE_NAME,
                    Type: 'Array'
                }
            },
            ListView: {
                Type: 'Grid',
                Fields: [],
                Columns: [],
                Context: {
                    Name: '',
                    Profile: {},
                    ScreenSize: 'Tablet'
                }
            },
            GenericResource: true,
            Hidden: false
        };

        return {
            Name: VISIT_FLOWS_TABLE_NAME,
            Extends: {
                AddonUUID: this._client.AddonUUID,
                Name: VISIT_FLOWS_BASE_TABLE_NAME
            },
            SyncData: {
                Sync: true
            },
            Type: 'data',
            ...udcObject
        };
    }

     /**
     * upserts a UDC scheme that inherits from visit flow groups scheme     
     * @returns udc scheme
     */
    private getGroupsUdcSchema(): any {
        const udcObject = {
            DocumentKey: {
                Delimiter: '@',
                Type: 'AutoGenerate',
                Fields: []
            },
            Fields: {},
            ListView: { 
                Type: 'Grid', 
                Fields: [], 
                Columns: [], 
                Context: { 
                    Name: '', 
                    Profile: {}, 
                    ScreenSize: 'Tablet' 
                } 
            },
            GenericResource: true
        };

        return {
            Name: VISIT_FLOW_GROUPS_TABLE_NAME,
            Extends: {
                AddonUUID: this._client.AddonUUID,
                Name: VISIT_FLOW_GROUPS_BASE_TABLE_NAME
            },
            SyncData: {
                Sync: true
            },
            Type: 'data',
            ...udcObject
        };
    }

    /**
     * upserts a UDC scheme that inherits from visit flow steps scheme     
     * @returns 
     */
    private getStepsUdcSchema(): any {
        const udcObject = {
            DocumentKey: {
                Delimiter: '@',
                Type: 'AutoGenerate',
                Fields: []
            },
            Fields: {},
            ListView: { 
                Type: 'Grid', 
                Fields: [], 
                Columns: [], 
                Context: { 
                    Name: '', 
                    Profile: {}, 
                    ScreenSize: 'Tablet' 
                } 
            },
            GenericResource: true
        };

        return {
            Name: VISIT_FLOW_STEPS_TABLE_NAME,
            Extends: {
                AddonUUID: this._client.AddonUUID,
                Name: VISIT_FLOW_STEPS_BASE_TABLE_NAME
            },
            SyncData: {
                Sync: true
            },
            Type: 'contained',
            ...udcObject
        };
    }

    async createATD() {
        const url = `/meta_data/activities/types`;
        return await this._papiClient.post(url, ActivityType);
    }

    async createTSAFields(atdId: string) {
        const bulkUrl = `/meta_data/bulk/activities/types/${atdId}/fields`;
        return await this._papiClient.post(bulkUrl, VisitFlowTSAFields);
    }

    /***********************************************************************************************/
    //                              User Events functions
    /************************************************************************************************/
    
    getVisitFLowUserEvents(query: any) {
        const events = {
            "Events": [{
                Title: 'On visit flow data load',
                EventKey: USER_ACTION_ON_VISIT_FLOW_LOAD
            }, {
                Title: 'On visit step click',
                EventKey: USER_ACTION_ON_VISIT_FLOW_STEP_CLICK
            }]
        }

        return events;
    }

}