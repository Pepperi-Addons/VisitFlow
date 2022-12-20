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
    Starter: boolean;
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
    private _activities: any[] = [];
    private _transactionsLoaded = false;
    private _transactions: any[] = [];
    private _serveys: any[] = [];
    private _loaderMap: Map<string, boolean>;
    private _accountUUID = '';

    constructor(accountUUID: string) {
        // this.loadActivities();
        // this._collectionName = name;
        this._accountUUID = accountUUID;
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
            this.getResourceDataPromise('activities', this._accountUUID)
        ]);
        debugger;
        if (res?.length === 2) {
            this._activeVisits = res[0];
            if (res[1].success && res[1].objects?.length) {
                this._activities = res[1].objects;
                this._loaderMap.set('activities', true);

            }
            if (this._activeVisits?.length && this._activities.length) {
                inProgressVisit = this.getInProgressVisit();
            }
        }
        
        return inProgressVisit;
    }

    /**
     * search for an in-progress visit
     * @returns in-progress visit info if exists, otherwise null
     */
    private getInProgressVisit() {
        //const strtEndActivities = this._activities.filter(activity => activity.TSAFlowID);
        const strtEndActivities = this._activities.filter(activity => activity.Type === 'VF_VisitFlowMainActivity');
        //VF_VisitFlowMainActivity
        debugger;
        let inProgressActivity: {
            VisitUUID: string,
            CreationDateTime: string
        } | null = null;
        let inProgressVisit: IInProgressVisit | null = null;

        for (let startEndActivity of strtEndActivities) {
            //TODO - get status from enum object
            if (startEndActivity.StatusName === 'InCreation') {
                inProgressActivity = {
                    VisitUUID: startEndActivity.UUID,
                    CreationDateTime: startEndActivity.CreationDateTime || null
                };
                break;
            }
        }

        if (inProgressActivity) {
            const inProgressVisitIndex = this._activeVisits.findIndex(visit => visit.UUID === inProgressActivity?.VisitUUID);
            if (inProgressVisitIndex >= 0) {
                inProgressVisit = {
                    ActiveVisitIndex: inProgressVisitIndex,
                    CreationDateTime: inProgressActivity.CreationDateTime
                }
            }
        }

        return inProgressVisit;
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

        if (inProgressVisit) {
            visits = this._activeVisits[inProgressVisit.ActiveVisitIndex];
        } else {
            visits = this._activeVisits;
        }

        for (let visit of visits) {
            const steps = visit.steps;
            let visitActivities: IVisitFlowActivity[] = [];
            for (let i = 0; i < steps.length; i++) {
                let activity: IVisitFlowActivity = _.clone(steps[i]);
                activity.Completed = await this.isActivityCompleted(steps[i].ResourceType, steps[i].ResourceTypeID, searchResource, steps[i].Completed); //New | InProgress | Completed                     
                activity.Starter = steps[i].ResourceTypeID === 'VF_VisitFlowMainActivity';
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

    private async isActivityCompleted(resourceType: string, resourceTypeID: string, searchResource: boolean, completedStatus: string) {
        if (!searchResource) {
            return false;
        }

        const resource = await this.getResource(resourceType, resourceTypeID);

        return resource && resource.StatusName === completedStatus;
    }

    //check if there is an activity of the same type and return its status   
    /* 
    private getActivityStatus(resourceType: string, resourceTypeID: string, searchResource: boolean): string {
        let status = 'New';        

        if (!searchResource) {
            return status;
        }

        const resource = this.getResource(resourceType, resourceTypeID);
        
        if (resource) {
            status = resource.StatusName;
        }

        return status;
    } */

    private async getResource(resourceType: string, resourceTypeID: string) {
        let resource: any = null;

        await this.loadResource(resourceType);

        switch(resourceType) {
            case 'activities':
                resource = this._activities.find(activity => activity.Type == resourceTypeID);
            break;

            case 'transactions':
                resource = this._transactions.find(transaction => transaction.Type == resourceTypeID);
            break;
        }
        /*switch (resourceType) {
            case 'activities':
                resource = this._activities.find(activity => activity.Type == resourceTypeID);
                break;
            case 'transactions':
                if (!this._transactionsLoaded) {
                    const res: any = await pepperi.api.transactions.search({
                        fields: ['UUID', 'Type', 'ActivityTypeID', 'StatusName', 'CreationDateTime'],
                        filter: {
                            ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: []
                        }
                    });
                    if (res.success && res.objects?.length) {
                        this._transactions = res.objects;
                    }
                    this._transactionsLoaded = true;
                }
                resource = this._transactions.find(transaction => transaction.Type == resourceTypeID);
                break;
            case 'surveys':
                //TODO
                break;
        } */

        return resource;
    }


    private async loadResource(resourceType) {
        let res: any = null;

        const loaded = this._loaderMap.get(resourceType);

        if (!loaded) {
            res = await this.getResourceDataPromise(resourceType, this._accountUUID);
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
        }

       // return Promise.resolve();

    }

    private getResourceDataPromise(resourceType: string, accountUUID: string) {
        switch (resourceType) {
            case 'activities':
                return pepperi.api.activities.search({
                    fields: ['UUID', 'Type', 'StatusName', 'CreationDateTime'],
                    filter: {
                        Operation: 'AND',
                        LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: [] },
                        RightNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [accountUUID.replace(/-/g, '')] }
                    }
                });
            case 'transactions':
                return pepperi.api.transactions.search({
                    fields: ['UUID', 'Type', 'StatusName', 'CreationDateTime'],
                    filter: {
                        Operation: 'AND',
                        LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: [] },
                        RightNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [accountUUID.replace(/-/g, '')] }
                    }
                });
            default:
                return null;
        }

    }

    async startVisit(visitUUID: string) {
        try {            
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
            return res && res.success === true ? `/activities/details/${res.id}` : '';
        } catch (err) {
            return '';
        }        
    }

    async getActivityUrl(client: IClient, resourceType: string, resourceTypeID: string, creationDateTime: string) {                
        let baseUrl: string = `/${resourceType}/details/`;        
        let resource: any;
        let catalogUUID = '';

        try {
            resource = await this.getResource(resourceType, resourceTypeID);
            debugger;
            if (resource) {
                return baseUrl + resource.UUID;
            } else {
                if (resourceType === 'transactions') {
                    catalogUUID = await this.chooseCatalog(client);
                    if (!catalogUUID) {
                        return '';
                    }
                }
                debugger;
                const newResource = await this.createResource(resourceType, resourceTypeID, catalogUUID);
                debugger;
                return baseUrl + newResource.UUID;
            }  
        } catch (err) {
            return '';
        }                      
    }   

    async chooseCatalog(client: IClient) {
        let catalogUUID = '';
        const templateModalOptions: any = {
            addonBlockName: 'ResourcePicker',
            hostObject: {
                resource: 'accounts',
                view: 'c684b1bd-74a5-4504-bf4f-9144cb77b8ee',
                selectionMode: 'single', // multi
                selectedObjectKeys: [],
            },
            title: 'Select catalog',
            allowCancel: true,
        };

        const catalogResult = await client?.showModal(templateModalOptions);

        // If catalog template was choosen
        if (!catalogResult.canceled && catalogResult.result?.action === 'on-save' && catalogResult.result.data?.selectedObjectKeys.length > 0) {
            catalogUUID = catalogResult.result.data.selectedObjectKeys[0];
        }

        return catalogUUID;
    }

    private async createResource(resourceType: string, resourceTypeID: string, accountUUID: string, catalogUUID: string = '') {
        let resource: any = null;

        switch (resourceType) {
            case 'activities': {
                const resource = await pepperi.app.activities.add({
                    type: {
                        Name: resourceTypeID
                    },
                    references: {
                        account: {
                            UUID: accountUUID
                        }
                    }
                });
                break;
            }
            case 'transactions': {
                const resource = await pepperi.app.transactions.add({
                    type: {
                        Name: resourceTypeID
                    },
                    references: {
                        account: {
                            UUID: accountUUID
                        },
                        catalog: {
                            Name: catalogUUID
                        }
                    }
                });
                break;
            }
        }

        return resource;
    }

}

export default VisitFlowService;