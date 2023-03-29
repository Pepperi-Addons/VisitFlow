
import { Client, Request } from '@pepperi-addons/debug-server';
import { ApiFieldObject, PapiClient, AddonDataScheme, SchemeFieldTypes } from "@pepperi-addons/papi-sdk";
import { ActivityType, VisitFlowTSAFields } from '../metadata';
import {
    VISIT_FLOW_MAIN_ACTIVITY,
    VISIT_FLOW_STEPS_TABLE_NAME,
    VISIT_FLOW_STEPS_BASE_TABLE_NAME,
    VISIT_FLOW_GROUPS_TABLE_NAME,
    VISIT_FLOW_GROUPS_BASE_TABLE_NAME,
    VISIT_FLOWS_TABLE_NAME,
    VISIT_FLOWS_BASE_TABLE_NAME,
    USER_ACTION_ON_VISIT_FLOW_LOAD,
    USER_ACTION_ON_VISIT_FLOW_STEP_CLICK
} from 'shared';

const UDC_UUID = '122c0e9d-c240-4865-b446-f37ece866c22';

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
        try {
            const flowsScheme = this.getFlowsSchema();
            const groupsScheme = this.getGroupsSchema();
            const stepsScheme = this.getStepsSchema();

            return Promise.all([
                this._papiClient.addons.data.schemes.post(flowsScheme),
                this._papiClient.addons.data.schemes.post(groupsScheme),
                this._papiClient.addons.data.schemes.post(stepsScheme)
            ]);
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    private getFlowsSchema(): AddonDataScheme {
        return {
            Name: VISIT_FLOWS_BASE_TABLE_NAME,
            Type: 'abstract',
            AddonUUID: this._client.AddonUUID,
            SyncData: {
                Sync: true
            },
            Fields: {
                Name:
                {
                    Type: 'String',
                    Indexed: true
                },
                Description:
                {
                    Type: 'String'
                },
                Active:
                {
                    Type: 'Bool'
                }
            },
            DataSourceData: {
                IndexName: `${UDC_UUID}_data`
            }
        }
    }

    private getGroupsSchema(): AddonDataScheme {
        return {
            Name: VISIT_FLOW_GROUPS_BASE_TABLE_NAME,
            Type: 'abstract',
            AddonUUID: this._client.AddonUUID,
            SyncData: {
                Sync: true
            },
            Fields: {
                Title:
                {
                    Type: 'String',
                    Indexed: true
                },
                SortIndex:
                {
                    Type: 'Integer'
                }
            },
            DataSourceData: {
                IndexName: `${UDC_UUID}_data`
            }
        }
    }

    // private getStepsSchema(): AddonDataScheme {
    //     return {
    //         Name: VISIT_FLOW_STEPS_BASE_TABLE_NAME,
    //         Type: 'abstract',
    //         AddonUUID: this._client.AddonUUID,
    //         SyncData: {
    //             Sync: true
    //         },
    //         Fields: {
    //             Title:
    //             {
    //                 Type: 'String'
    //             },
    //             Group:
    //             {
    //                 Type: 'Resource',
    //                 Resource: VISIT_FLOW_GROUPS_BASE_TABLE_NAME,
    //                 AddonUUID: this._client.AddonUUID,
    //             },
    //             Resource:
    //             {
    //                 Type: 'String'
    //             },
    //             ResourceCreationData:
    //             {
    //                 Type: 'String'
    //             },
    //             Mandatory:
    //             {
    //                 Type: 'Bool'
    //             },
    //             Completed:
    //             {
    //                 Type: 'String'
    //             }
    //         }
    //     }
    // }

    private getStepsSchema(): AddonDataScheme {
        const scheme: AddonDataScheme = {
            Name: VISIT_FLOW_STEPS_BASE_TABLE_NAME,
            Type: 'abstract',
            AddonUUID: this._client.AddonUUID,
            SyncData: {
                Sync: true
            },
            Fields: {
                Title:
                {
                    Type: 'String',
                    Indexed: true
                },
                Group:
                {
                    Type: 'Resource',
                    Resource: VISIT_FLOW_GROUPS_BASE_TABLE_NAME,
                    AddonUUID: this._client.AddonUUID
                },
                Resource:
                {
                    Type: 'String'
                },
                ResourceCreationData:
                {
                    Type: 'String'
                },
                Mandatory:
                {
                    Type: 'Bool' 
                },
                Completed:
                {
                    Type: 'Array',
                    Items: {
                        Type: 'String'
                    }
                },
                MaxCount:
                {
                    Type: 'Integer'
                }
            },
            DataSourceData: {
                IndexName: `${UDC_UUID}_data`
            }
        }
            scheme.Fields!['Completed']['OptionalValues'] = ['In Creation','Submitted','In Progress','On Hold','Cancelled','Need Revision','Closed','Failed','Need Approval','ERP','Invoice','Need Online Approval','In Planning','Published','In Payment','Need Payment'];
            scheme.Fields!['Resource']['OptionalValues'] = ['transactions','activities','MySurveys'];
        return scheme;
    }

    async upsertUDCs() {
        try {
            const stepsScheme = this.getStepsUdcSchema();
            await this._papiClient.userDefinedCollections.schemes.upsert(stepsScheme)
            const flowsScheme = this.getFlowsUdcSchema();
            const groupsScheme = this.getGroupsUdcSchema();

            return Promise.all([
                this._papiClient.userDefinedCollections.schemes.upsert(flowsScheme),
                this._papiClient.userDefinedCollections.schemes.upsert(groupsScheme)
            ]);
        } catch (err: any) {
            throw new Error(err.message);
        }
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
        try {
            const fetchUrl = `/types?where=Name='${VISIT_FLOW_MAIN_ACTIVITY}'&include_deleted=1`;
            const startEndActivities = await this._papiClient.get(fetchUrl);
            if (startEndActivities?.length) {
                if (startEndActivities[0].Hidden === true) {
                    const currentItem = {
                        InternalID: startEndActivities[0].InternalID,
                        Hidden: false
                    }
                    await this._papiClient.post('/meta_data/activities/types', currentItem);
                    //return null;
                } 

                return {
                    TypeID:  startEndActivities[0].InternalID,
                    InternalID: startEndActivities[0].InternalID,
                    Hidden: false
                }
            } else {
                const url = `/meta_data/activities/types`;
                return await this._papiClient.post(url, ActivityType);
            }
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    async createTSAFields(atdId: string) {
        try {
            const bulkUrl = `/meta_data/bulk/activities/types/${atdId}/fields`;
            return await this._papiClient.post(bulkUrl, VisitFlowTSAFields);
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    /***********************************************************************************************/
    //                              User Events functions
    /************************************************************************************************/

    getVisitFLowUserEvents(query: any) {
        const events = {
            "Events": [
                {
                    Title: 'On visit flow data load',
                    EventKey: USER_ACTION_ON_VISIT_FLOW_LOAD,
                    EventData: {
                        Data: {
                            Type: 'Object'
                        }
                    }
                }, {
                    Title: 'On visit step click',
                    EventKey: USER_ACTION_ON_VISIT_FLOW_STEP_CLICK,
                    EventData: {
                        Data: {
                            Type: 'Object'
                        }
                    }
                }
            ]
        }

        return events;
    }

}