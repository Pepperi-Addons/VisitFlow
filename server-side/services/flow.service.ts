
import { Client, Request } from '@pepperi-addons/debug-server';
import { ApiFieldObject, PapiClient, AddonDataScheme, SchemeFieldTypes } from "@pepperi-addons/papi-sdk";
import { ActivityType, VisitFlowTSAFields } from '../metadata';

const SCHEME_NAMES = {
    VISIT_FLOWS: 'visitFlows',
    UDC_VISIT_FLOW: 'VisitFlows',
    VISIT_FLOW_GROUPS: 'visitFlowGroups',
    UDC_VISIT_FLOW_GROUPS: 'VisitFlowGroups',
    VISIT_FLOW_STEPS: 'visitFlowSteps',
    UDC_VISIT_FLOW_STEPS: 'VisitFlowSteps'
}

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
            Name: SCHEME_NAMES.VISIT_FLOWS,
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
            Name: SCHEME_NAMES.VISIT_FLOW_GROUPS,
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
            Name: SCHEME_NAMES.VISIT_FLOW_STEPS,
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
                    Resource: SCHEME_NAMES.VISIT_FLOW_GROUPS,
                    AddonUUID: this._client.AddonUUID
                },
                ActivityId:
                {
                    Type: 'String'
                },
                ObjectType:
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
                        Resource: SCHEME_NAMES.UDC_VISIT_FLOW_STEPS,
                        Type: 'ContainedResource'
                    },
                    Mandatory: false,
                    OptionalValues: [],
                    Resource: SCHEME_NAMES.UDC_VISIT_FLOW_STEPS,
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
            Name: SCHEME_NAMES.UDC_VISIT_FLOW,
            Extends: {
                AddonUUID: this._client.AddonUUID,
                Name: SCHEME_NAMES.VISIT_FLOWS
            },
            SyncData: {
                Sync: true
            },
            Type: 'data',
            ...udcObject
        };
    }

     /**
     * upserts a UDC scheme that inherits from 'visitFlowGroups' scheme     
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
            Name: SCHEME_NAMES.UDC_VISIT_FLOW_GROUPS,
            Extends: {
                AddonUUID: this._client.AddonUUID,
                Name: SCHEME_NAMES.VISIT_FLOW_GROUPS
            },
            SyncData: {
                Sync: true
            },
            Type: 'data',
            ...udcObject
        };
    }

    /**
     * upserts a UDC scheme that inherits from 'visitFlowSteps' scheme     
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
            Name: SCHEME_NAMES.UDC_VISIT_FLOW_STEPS,
            Extends: {
                AddonUUID: this._client.AddonUUID,
                Name: SCHEME_NAMES.VISIT_FLOW_STEPS
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



}