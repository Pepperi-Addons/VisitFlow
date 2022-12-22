import { IClient } from '@pepperi-addons/cpi-node/build/cpi-side/events';
import { activityType2ResourceType } from '@pepperi-addons/cpi-node/build/cpi-side/wrappers';
import _ from 'lodash';

interface IVisitFlowActivity {
    Group: string;
    ResourceType: 'activities' | 'transactions' | 'surveys';
    ResourceTypeID: string;
    Title: string;
    Mandatory: boolean;
    Disabled?: boolean;
    Completed: boolean;
    Starter?: boolean;
    DepandsOnStep?: number;
    [key: string]: any;
}

interface IInProgressVisit {
    ActiveVisitIndex: number,
    CreationDateTime: string
}

class VisitFlowService {
    // private _collectionName = '';
    private _activeVisits: any[] = [];
    private _startEndActivities: any[] = [];
    private _activities: any[] = [];
    private _transactionsLoaded = false;
    private _transactions: any[] = [];
    private _serveys: any[] = [];
    private _loaderMap: Map<string, boolean>;
    private _accountUUID = '';

    constructor(accountUUID: string) {
        // this.loadActivities();
        // this._collectionName = name;
        this._accountUUID = accountUUID.replace(/-/g, '');
        this._loaderMap = new Map();

    }

    /**
     * get in-progress visit if exists, null otherwise
     * @param collectionName udc name
     * @returns in-progress visit object
     */
    async getInProgressVisitFlow(collectionName: string) {
        let inProgressVisit: IInProgressVisit | null = null;

        const res: any = await Promise.all([
            pepperi.resources.resource(collectionName).get({ where: 'Active = true' }),
            this.getStartEndActivitiesPromise()
            //this.getResourceDataPromise('activities', /*['CreationDateTime', 'TSAFlowID']*/[])
        ]);
        debugger;
        if (res?.length === 2 && res[0].length) {
            this._activeVisits = res[0];
            if (res[1].success && res[1].objects?.length) {
                //this._startEndActivities = res[1].objects;
                inProgressVisit = await this.getInProgressVisit(res[1].objects[0]);
            }
        }

        return inProgressVisit;
    }

    /**
     * search for an in-progress visit
     * @returns in-progress visit info if exists, otherwise null
     */
    private async getInProgressVisit(activity) {
        let inProgressVisit: IInProgressVisit | null = null;

        if (activity.StatusName !== 'Submitted') {
            const inProgressVisitIndex = this._activeVisits.findIndex(visit => visit.Key === activity.TSAFlowID);
            if (inProgressVisitIndex >= 0) {
                inProgressVisit = {
                    ActiveVisitIndex: inProgressVisitIndex,
                    CreationDateTime: activity.CreationDateTime
                }
            }
        }
        /*
        const inProgressActivity = await this.getOpenStartActivity();
        debugger;
        if (inProgressActivity) {
            const inProgressVisitIndex = this._activeVisits.findIndex(visit => visit.Key === inProgressActivity.VisitUUID);
            if (inProgressVisitIndex >= 0) {
                inProgressVisit = {
                    ActiveVisitIndex: inProgressVisitIndex,
                    CreationDateTime: inProgressActivity.CreationDateTime
                }
            }
        }*/

        return inProgressVisit;
    }

    private async getOpenStartActivity() {
        //const startEndActivities = this._activities.filter(activity => activity.Type === 'VF_VisitFlowMainActivity');
        //VF_VisitFlowMainActivity
        debugger;
        let inProgressActivity: {
            UUID: string;
            VisitUUID: string;
            CreationDateTime: string;
        } | null = null;
        let inProgressUUID = '';

        for (let startEndActivity of this._startEndActivities) {
            if (startEndActivity.StatusName !== 'Submitted') {
                //load start activity data                
                inProgressUUID = startEndActivity.UUID;
                break;
            }
        }
        debugger;
        if (inProgressUUID) {
            const res: any = await pepperi.api.activities.get({
                key: { UUID: inProgressUUID },
                fields: ['TSAFlowID', 'CreationDateTime']
            });
            if (res?.success === true && res.object) {
                inProgressActivity = {
                    UUID: inProgressUUID,
                    VisitUUID: res.object.TSAFlowID,
                    CreationDateTime: res.object.CreationDateTime
                }
            }
        }

        return inProgressActivity;
    }

    /**
     * create list of all active visit flows
     * @param inProgressVisit object containing the in-progress visit flow, if no such the value equals to null
     * @param searchActivity whether searching for an activity status is needed
     * @returns list of flows
     */
    async createVisitFlows(inProgressVisit: IInProgressVisit | null = null, searchResource = false) {
        let visitFlows: any[] = [];
        let visits;

        debugger;
        if (inProgressVisit) {
            visits = [this._activeVisits[inProgressVisit.ActiveVisitIndex]];
        } else {
            visits = this._activeVisits;
        }

        for (let visit of visits) {
            const steps = visit.steps;
            let visitActivities: IVisitFlowActivity[] = [];
            for (let i = 0; i < steps.length; i++) {
                let activity: IVisitFlowActivity = _.clone(steps[i]);
                activity.Completed = await this.isActivityCompleted(
                    steps[i].ResourceType, steps[i].ResourceTypeID,
                    inProgressVisit && inProgressVisit.CreationDateTime ? inProgressVisit.CreationDateTime : '',
                    searchResource,
                    steps[i].Completed);
                if (steps[i].ResourceTypeID === 'VF_VisitFlowMainActivity') {
                    activity.Starter = true;
                }
                visitActivities.push(activity);
            }
            visitFlows.push({
                Key: visit.Key,
                Name: visit.Name,
                Title: visit.Description,
                InProgress: inProgressVisit !== null,
                CreationDateTime: inProgressVisit && inProgressVisit.CreationDateTime ? inProgressVisit.CreationDateTime : null,
                Activities: [...visitActivities]
            });
        }

        return visitFlows;
    }

    private async isActivityCompleted(resourceType: string, resourceTypeID: string, creationDateTime: string, searchResource: boolean, completedStatus: string) {
        if (!searchResource) {
            return false;
        }

        const item = await this.getResourceItem(resourceType, resourceTypeID, creationDateTime, completedStatus);
        debugger;
        if (item) {
            if (item && item.StatusName === completedStatus) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /*
    private async getResource(resourceType: string, resourceTypeID: string, creationDateTime: string) {
        let resource: any = null;

        try {
            await this.loadResource(resourceType);
            debugger;
            switch (resourceType) {
                case 'activities':
                    resource = this._activities.find(activity => activity.Type == resourceTypeID);
                    break;

                case 'transactions':
                    resource = this._transactions.find(transaction => transaction.Type == resourceTypeID);
                    break;
            }
        } catch (err) {
            debugger;
        }


        return resource;
    } 
    */

    private async getResourceItem(resourceType: string, resourceTypeID: string, creationDateTime: string, completedStatus: string = '') {
        try {
            /*const searchObject = {
                fields: ['UUID', 'StatusName'],
                filter: {
                    Operation: 'AND',
                    LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: '>=', Values: [creationDateTime] },
                    RightNode: {
                        Operation: 'AND',
                        LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountUUID] },
                        RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceTypeID] }
                    }
                },
                sorting: [{ Field: 'CreationDateTime', Ascending: true }]
            } */

            let item: any | null = null;
            let res: any;
            debugger;
            switch (resourceType) {
                case 'activities':                                       
                    res = await pepperi.api.activities.search({
                        fields: ['UUID', 'StatusName'],
                        filter: {
                            Operation: 'AND',
                            LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountUUID] },
                            RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceTypeID] }                           
                        },
                        sorting: [{ Field: 'CreationDateTime', Ascending: false }],
                        pageSize: 1 
                    }); 
                    break;
                case 'transactions':
                    res = await pepperi.api.transactions.search({
                        fields: ['UUID', 'StatusName'],
                        filter: {
                            Operation: 'AND',
                            LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountUUID] },
                            RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceTypeID] }
                            /*Operation: 'AND',
                            LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'After', Values: [creationDateTime] },
                            RightNode: {
                                Operation: 'AND',
                                LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountUUID] },
                                RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceTypeID] }
                            } */
                        },
                        sorting: [{ Field: 'CreationDateTime', Ascending: false }],
                        pageSize: 1
                    });
                    break;
                case 'surveys':

                    break;
                default:
                    return null;

            }
            debugger;
            if (res?.success === true && res.objects.length) {
                //search for completed status in all resources
                item = res.objects[0];
                if (completedStatus) {
                    for (let resource of res.objects) {
                        if (resource.StatusName === completedStatus) {
                            item = resource;
                            break;
                        }
                    }
                }
            }

            return item;
        } catch (err) {
            debugger;
            return null;
        }
    }

    private async loadResource(resourceType) {
        let res: any = null;

        try {
            //const loaded = this._loaderMap.get(resourceType);

            debugger;
            //if (!loaded) {
            res = await this.getResourceDataPromise(resourceType);
            if (res?.success && res.objects?.length) {
                switch (resourceType) {
                    case 'activities':
                        this._activities = res.objects;
                        this._loaderMap.set(resourceType, true);
                        break;
                    case 'transactions':
                        this._transactions = res.objects;
                        this._loaderMap.set(resourceType, true);
                        break;
                }
            }
            //}
        } catch (err) {
            debugger;
        }


        // return Promise.resolve();

    }

    private getResourceDataPromise(resourceType: string, additionalFields: string[] = []) {
        try {
            debugger;
            let fieldList = ['UUID', 'Type', 'StatusName'];
            if (additionalFields.length) {
                fieldList = [...fieldList, ...additionalFields];
            }
            switch (resourceType) {
                case 'activities':
                    return pepperi.api.activities.search({
                        fields: fieldList,
                        filter: {
                            Operation: 'AND',
                            LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: [] },
                            RightNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountUUID.replace(/-/g, '')] }
                        }
                    });
                case 'transactions':
                    return pepperi.api.transactions.search({
                        fields: fieldList,
                        filter: {
                            Operation: 'AND',
                            LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: [] },
                            RightNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountUUID.replace(/-/g, '')] }
                        }
                    });
                default:
                    return null;
            }
        } catch (err) {
            debugger;
            return null;
        }

    }

    private getStartEndActivitiesPromise() {
        return pepperi.api.activities.search({
            fields: ['UUID', 'Type', 'StatusName', 'CreationDateTime', 'TSAFlowID'],
            filter: {
                Operation: 'AND',
                LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: [] },
                RightNode: {
                    Operation: 'AND',
                    LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountUUID] }
                    , RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: ['VF_VisitFlowMainActivity'] }
                }
            },
            sorting: [{ Field: 'CreationDateTime', Ascending: false }],
            pageSize: 1
        });

    }

    /**
     * returns startEnd activity, if exists return the item otherwise creates a new one
     * @param visitUUID 
     * @returns 
     */
    async getStartVisitUrl(visitUUID: string) {
        try {
            let url = '/activities/details/';
            let activity: any = null;
            //await this.loadResource('activities');
            //
            const res: any = await this.getStartEndActivitiesPromise();
            debugger;

            if (res?.success && res.objects.length === 1) {
                // activity = await this.getOpenStartActivity(/*res.objects[0]*/);
                if (res.objects[0].StatusName !== 'Submitted') {
                    activity = res.objects[0];
                }

            }

            //

            debugger;
            if (activity) {
                url += activity.UUID;
            } else {
                const res: any = await pepperi.app.activities.add({
                    type: {
                        Name: 'VF_VisitFlowMainActivity'
                    },
                    references: {
                        account: {
                            UUID: this._accountUUID//'10001010'
                        }
                    },
                    object: {
                        TSAFlowID: visitUUID
                    }
                });
                debugger;
                if (res && res.success === true && res.id) {
                    url += res.id;
                } else {
                    return '';
                }
                //return res && res.success === true ? `/activities/details/${res.id}` : '';
            }

            return url;

        } catch (err) {
            return '';
        }
    }

    async getActivityUrl(client: IClient, resourceType: string, resourceTypeID: string, creationDateTime: string) {
        let url = `/${resourceType}/details/`;
        let resource: any;
        let catalogName = '';

        try {
            resource = await this.getResourceItem(resourceType, resourceTypeID, creationDateTime);
            //resource = await this.getResource(resourceType, resourceTypeID);
            debugger;
            if (resource) {
                return url + resource.UUID;
            } else {
                if (resourceType === 'transactions') {
                    catalogName = await this.chooseCatalog(client);
                    if (!catalogName) {
                        return '';
                    }
                }
                debugger;
                const newResource = await this.createResource(resourceType, resourceTypeID, catalogName);
                debugger;
                return url + newResource.id;
            }
        } catch (err) {
            return '';
        }
    }

    private async chooseCatalog(client: IClient) {
        let catalogName = '';
        const templateModalOptions: any = {
            addonBlockName: 'ResourcePicker',
            hostObject: {
                resource: 'catalogs',
                view: 'baab3dca-0dfd-4141-9dec-c62b34a09c98',
                selectionMode: 'single', // multi
                selectedObjectKeys: [],
            },
            title: 'Select catalog',
            allowCancel: true,
        };

        const catalogResult = await client?.showModal(templateModalOptions);

        // If catalog template was choosen
        if (!catalogResult.canceled && catalogResult.result?.action === 'on-save' && catalogResult.result.data?.selectedObjectKeys.length > 0) {
            catalogName = catalogResult.result.data.selectedObjectKeys[0];
        }

        return catalogName;
    }

    private async createResource(resourceType: string, resourceTypeID: string, catalogName: string = '') {
        let resource: any = null;

        try {
            switch (resourceType) {
                case 'activities': {
                    resource = await pepperi.app.activities.add({
                        type: {
                            Name: resourceTypeID
                        },
                        references: {
                            account: {
                                UUID: this._accountUUID
                            }
                        }
                    });
                    break;
                }
                case 'transactions': {
                    resource = await pepperi.app.transactions.add({
                        type: {
                            Name: resourceTypeID
                        },
                        references: {
                            account: {
                                UUID: this._accountUUID
                            },
                            catalog: {
                                Name: catalogName
                            }
                        }
                    });
                    break;
                }
            }
        } catch (err) {
            debugger;
            return resource;
        }


        debugger;
        return resource;
    }

}

export default VisitFlowService;