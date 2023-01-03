import { IClient } from '@pepperi-addons/cpi-node/build/cpi-side/events';
import { activityType2ResourceType } from '@pepperi-addons/cpi-node/build/cpi-side/wrappers';
import {
    IVisitFlow,
    VISIT_FLOW_GROUPS_TABLE_NAME,
    VISIT_FLOW_MAIN_ACTIVITY
} from 'shared';
import _ from 'lodash';


interface IInProgressVisit {
    ActiveVisitIndex: number,
    CreationDateTime: string
}

class VisitFlowService {
    private _activeVisits: any[] = [];
    private _accountUUID = '';
    private _accountStr = ''

    constructor(accountUUID: string) {
        this._accountUUID = accountUUID;
        this._accountStr = accountUUID.replace(/-/g, '');
    }

    /**
     * gets UDC visits. in case of an in-progress visit - returns the in-progress visits only
     * @param UDCName udc name
     * @returns visit flow(s)
     */
    async getVisits(UDCName: string) {
        const inProgressVisit = await this.getInProgressVisitFlow(UDCName);
        return this.createVisitFlows(inProgressVisit);
    }

    /**
     * get in-progress visit if exists, null otherwise
     * @param UDCName udc name
     * @returns in-progress visit object
     */
    private async getInProgressVisitFlow(UDCName: string) {
        let inProgressVisit: IInProgressVisit | null = null;

        try {
            const res: any = await Promise.all([
                pepperi.resources.resource(UDCName).get({ where: 'Active = true' }),
                this.getStartEndActivitiesPromise()
            ]);
            debugger;
            if (res?.length === 2 && res[0].length) {
                this._activeVisits = res[0];
                console.log('start end activitiies found', res[1].objects?.length);
                if (res[1].success && res[1].objects?.length) {
                    inProgressVisit = await this.getInProgressVisit(res[1].objects[0]);
                }
            }

            return inProgressVisit;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    /**
     * search for an in-progress visit
     * @returns in-progress visit info if exists, otherwise null
     */
    private async getInProgressVisit(activity) {
        let inProgressVisit: IInProgressVisit | null = null;

        try {
            if (activity.StatusName !== 'Submitted') {
                const inProgressVisitIndex = this._activeVisits.findIndex(visit => visit.Key === activity.TSAFlowID);
                if (inProgressVisitIndex >= 0) {
                    inProgressVisit = {
                        ActiveVisitIndex: inProgressVisitIndex,
                        CreationDateTime: activity.CreationDateTime
                    }
                }
            }

            return inProgressVisit;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    /**
     * create list of all active visit flows
     * @param inProgressVisit object containing the in-progress visit flow, if no such the value equals to null
     * @param searchActivity whether searching for an activity status is needed
     * @returns list of flows
     */
    async createVisitFlows(inProgressVisit: IInProgressVisit | null = null) {
        let visitFlows: IVisitFlow[] = [];
        let udcVisits;

        try {
            debugger;
            if (inProgressVisit) {
                udcVisits = [this._activeVisits[inProgressVisit.ActiveVisitIndex]];
            } else {
                udcVisits = this._activeVisits;
            }
            debugger;
            await this.updateVisitSteps(udcVisits, inProgressVisit);
            debugger;
            visitFlows = await this.convertToVisitFlows(udcVisits, inProgressVisit !== null);
            debugger;

            //TODO - rebuild with groups
            /*
            for (let visit of udcVivisits) {
                const steps = visit.steps;
                let visitActivities: IVisitFlowActivity[] = [];
                let foundStarter = false;
                for (let i = 0; i < steps.length; i++) {
                    let step: IVisitFlowActivity = _.clone(steps[i]);
                    step.Completed = await this.isStepCompleted(
                        steps[i].ResourceType,
                        steps[i].ResourceTypeID,
                        inProgressVisit && inProgressVisit.CreationDateTime ? inProgressVisit.CreationDateTime : '',
                        inProgressVisit !== null,
                        steps[i].Completed);
                    if (inProgressVisit) {
                        //TODO - lock end activity if found mandatory incomplete
                    } else {
                        //in case visit isnt in progress - disable all steps except for the first start step
                        if (steps[i].ResourceTypeID === VISIT_FLOW_MAIN_ACTIVITY && !foundStarter) {
                            step.Disabled = false;
                            foundStarter = true;
                        } else {
                            step.Disabled = true;
                        }
                    }

                    visitActivities.push(step);
                }
                visitFlows.push({
                    Key: visit.Key,
                    Name: visit.Name,
                    Title: visit.Description,
                    InProgress: inProgressVisit !== null,
                    CreationDateTime: inProgressVisit && inProgressVisit.CreationDateTime ? inProgressVisit.CreationDateTime : null,
                    Activities: [...visitActivities]
                });
            } */

            return visitFlows;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    private async updateVisitSteps(visits: any[], inProgress: IInProgressVisit | null) {
        for (let visit of visits) {
            const steps = visit.steps;
            let starterFound = false;
            let mandatoryIncompleteFound = false;
            for (let i = 0; i < steps.length; i++) {
                //let step: any = _.clone(steps[i]);
                if (inProgress) {
                    const resource = await this.getResourceItem(
                        steps[i].ResourceType,
                        steps[i].ResourceTypeID,
                        inProgress.CreationDateTime ? inProgress.CreationDateTime : ''
                    );
                    steps[i].Activities = resource ? [resource.UUID] : [];
                    steps[i].Completed = this.isStepCompleted(
                        resource,
                        steps[i].Completed);
                } else {
                    steps[i].Activities = [];
                    steps[i].Completed = false;
                    //in case visit isnt in progress - disable all steps except for the first start step
                    if (steps[i].ResourceType === 'activities' && steps[i].ResourceTypeID === VISIT_FLOW_MAIN_ACTIVITY && !starterFound) {
                        steps[i].Disabled = false;
                        starterFound = true;
                    } else {
                        steps[i].Disabled = true;
                    }
                }
                if (steps[i].Mandatory && !steps[i].Completed) {
                    mandatoryIncompleteFound = true;
                }
            }
            //debugger;
            if (mandatoryIncompleteFound) {
                this.lockEndActivity(steps);
            }
            //debugger;
        }
    }

    /**
     * disable end visit activity
     * @param steps 
     */
    private lockEndActivity(steps: any[]) {
        for (let i = steps.length - 1; i >= 0; i--) {
            if (
                steps[i].ResourceType === 'activities' &&
                steps[i].ResourceTypeID === VISIT_FLOW_MAIN_ACTIVITY
            ) {
                steps[i].Disabled = true;
                break;
            }
        }
    }

    private async convertToVisitFlows(udcVisits: any[], isInProgress: boolean) {
        let visits: IVisitFlow[] = [];
        let udcGroups: any[] = [];

        try {
            let res: any = await pepperi.resources.resource(VISIT_FLOW_GROUPS_TABLE_NAME).search({
                Fields: ['Title', 'SortIndex']
            });
            debugger;

            if (res?.Objects?.length) {
                udcGroups = res.Objects;
            }

            for (let visit of udcVisits) {
                let groups = _(visit.steps)
                    .groupBy(step => step.Group)
                    .map(group => {
                        return {
                            Title: group[0].Group,
                            Steps: group
                        }
                    })
                    .value();
                debugger;
                //in case VISIT_FLOW_GROUPS_TABLE_NAME is defined - use it to sort the groups
                if (udcGroups?.length) {
                    const sortedGroups = groups.sort((a, b) => {
                        const groupA = udcGroups.find(item => item.Title === a.Title);
                        const groupB = udcGroups.find(item => item.Title === b.Title);
                        if (groupA && groupB) {
                            return groupA.SortIndex - groupB.SortIndex;
                        } else {
                            return 0;
                        }
                    });
                    groups = sortedGroups;
                }
                visits.push({
                    Key: visit.Key,
                    Title: visit.Description,
                    InProgress: isInProgress,
                    Groups: groups
                });
            }

            return visits;
        } catch (err: any) {
            debugger;
            throw new Error(err.message);
        }
    }

    private isStepCompleted(item: any, completedStatus: string) {
        try {
            //debugger;
            if (item) {
                if (item && item.StatusName === completedStatus) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }

        } catch (err: any) {
            throw new Error(err.message);
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
                    LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountStr] }
                    , RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [VISIT_FLOW_MAIN_ACTIVITY] }
                }
            },
            sorting: [{ Field: 'CreationDateTime', Ascending: false }],
            pageSize: 1
        });

    }

    private async getResourceItem(resourceType: string, resourceTypeID: string, creationDateTime: string) {
        try {
            /*const searchObject = {
                fields: ['UUID', 'StatusName'],
                filter: {
                    Operation: 'AND',
                    LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: '>=', Values: [creationDateTime] },
                    RightNode: {
                        Operation: 'AND',
                        LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountStr] },
                        RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceTypeID] }
                    }
                },
                sorting: [{ Field: 'CreationDateTime', Ascending: true }]
            } */
            let startDateTime = creationDateTime ? creationDateTime : this.getToday();
            let item: any | null = null;
            let res: any;
            debugger;

            /*if (creationDateTime) {
                startDateTime = creationDateTime;
            } else {
                let today = new Date();
                today.setHours(0, 0, 0, 0);
                startDateTime = today.toISOString();
                debugger;
            } */
            switch (resourceType) {
                case 'activities':
                    res = await pepperi.api.activities.search({
                        fields: ['UUID', 'StatusName', 'CreationDateTime'],
                        filter: {
                            Operation: 'AND',
                            LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: [] },
                            RightNode: {
                                Operation: 'AND',
                                LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountStr] }
                                , RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceTypeID] }
                            }
                            /*
                            Operation: 'AND',
                            LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountStr] },
                            RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceTypeID] }*/
                        },
                        sorting: [{ Field: 'CreationDateTime', Ascending: false }],
                        pageSize: 1
                    });
                    debugger;
                    if (res?.success && res.objects?.length) {
                        if (creationDateTime) {
                            if (res.objects[0].CreationDateTime >= creationDateTime) {
                                item = res.objects[0];
                            }
                        } else {
                            item = res.objects[0];
                        }
                    }
                    break;
                case 'transactions':
                    res = await pepperi.api.transactions.search({
                        fields: ['UUID', 'StatusName', 'CreationDateTime'],
                        filter: {
                            Operation: 'AND',
                            LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: [] },
                            RightNode: {
                                Operation: 'AND',
                                LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountStr] }
                                , RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceTypeID] }
                            }                            /*Operation: 'AND',
                            LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'After', Values: [creationDateTime] },
                            RightNode: {
                                Operation: 'AND',
                                LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountStr] },
                                RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceTypeID] }
                            } */
                        },
                        sorting: [{ Field: 'CreationDateTime', Ascending: false }],
                        pageSize: 1
                    });
                    if (res?.success && res.objects?.length) {
                        if (creationDateTime) {
                            if (res.objects[0].CreationDateTime >= creationDateTime) {
                                item = res.objects[0];
                            }
                        } else {
                            item = res.objects[0];
                        }
                    }
                    break;
                case 'surveys':
                    res = await pepperi.resources.resource('Surveys').search({
                        Fields: ['Key', 'Status', 'CreationDateTime', 'AccountUUID'],
                        //Where: `"Template='${resourceTypeID}' And AccountUUID='${this._accountStr}' And CreationDateTime >= '${creationDateTime}'"`                        
                        Where: `Template='${resourceTypeID}'`

                    });
                    if (res?.Objects?.length) {
                        //debugger;

                        let templates = res.Objects.filter(template => template.AccountUUID === this._accountUUID && template.CreationDateTime >= startDateTime);
                        //debugger;
                        if (templates.length) {
                            item = {
                                UUID: templates[0].Key,
                                StatusName: templates[0].Status || ''
                            }
                        }
                    }
                    break;
            }
            // debugger;
            /*if (res?.success === true && res.objects.length) {
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
            } */

            return item;
        } catch (err: any) {
            debugger;
            throw new Error(err.message);
            //return null;
        }
    }

    /**
     * returns startEnd activity, if exists return the item otherwise creates a new one
     * @param visitUUID 
     * @returns 
     */
    async getStartVisitUrl(step: any, visitUUID: string) {
        try {
            let url = '/activities/details/';
            let activity: any = null;

            //await data.client?.alert('getStartVisitUrl init', '');

            /*
            const res: any = await this.getStartEndActivitiesPromise();
            debugger;

            //await data.client?.alert('after start activity search', '');
            if (res?.success && res.objects?.length === 1) {
                if (res.objects[0].StatusName !== 'Submitted') {
                    activity = res.objects[0];
                }
            }*/

            debugger;
            if (step?.Activities?.length) {
                url += step.Activities[0];
                //await data.client?.alert('found activit, url - ', url);
            } else {
                debugger;
                //await data.client?.alert('creating new activity', this._accountUUID);
                const res: any = await pepperi.app.activities.add({
                    type: {
                        Name: VISIT_FLOW_MAIN_ACTIVITY
                    },
                    references: {
                        account: {
                            UUID: this._accountUUID
                        }
                    },
                    object: {
                        TSAFlowID: visitUUID
                    }
                });
                debugger;
                if (res && res.success === true && res.id) {
                    //await data.client?.alert('after creating activity success', '');
                    url += res.id;
                } else {
                    //await data.client?.alert('after creating activity failed', '');
                    throw new Error('Failed to create activity');
                }
            }
            //await data.client?.alert('Creating start activity, url', url);
            return url;

        } catch (err: any) {
            debugger;
            //if (err?.message) {
            //await data.client?.alert('caught exc', err?.message);
            throw new Error(err.message);
            //}            

            //return '';
        }
    }

    async getActivityUrl(client: IClient, step: any) {
        let url = this.getBaseUrl(step.ResourceType);
        let resource: any;
        let catalogName = '';

        try {
            // = await this.getResourceItem(resourceType, resourceTypeID, creationDateTime);            
            debugger;
            if (step?.Activities?.length) {
                return url + step.Activities;
            } else {
                if (step.ResourceType === 'transactions') {
                    catalogName = await this.chooseCatalog(client);
                    //await client?.alert('outer choose catalog', catalogName);
                    if (!catalogName) {
                        //catalogName = 'Default Catalog';                         
                        throw new Error('Catalog was not selected');
                    }
                }
                debugger;
                const newResource = await this.createResource(step.ResourceType, step.ResourceTypeID, catalogName);
                debugger;
                if (newResource?.id) {
                    return url + newResource.id;
                } else {
                    throw new Error(`Resource ${step.ResourceTypeID} was not created`);
                }

            }
        } catch (err: any) {
            //await client?.alert('outer choose catalog exc', err?.message);
            throw new Error(err.message);
        }
    }

    private getToday() {
        let dt = new Date();
        let year = dt.getFullYear();
        let month = dt.getMonth() + 1;
        let monthStr;
        let day = dt.getDate();
        let dayStr;

        monthStr = month < 10 ? '0' + month : month;
        dayStr = day < 10 ? '0' + day : day;

        return `${year}-${monthStr}-${dayStr}T00:00:00.000Z`;

    }

    private getBaseUrl(resourceType: string) {
        switch (resourceType) {
            case 'activities':
                return `/${resourceType}/details/`;
            case 'transactions':
                return `/${resourceType}/scope_items/`;
            case 'surveys':
                return `${resourceType}?survey_key=`;
        }
    }

    private async chooseCatalog(client: IClient) {
        let catalogKey = '';
        let catalogName = '';
        try {
            const templateModalOptions: any = {
                addonBlockName: 'ResourcePicker',
                hostObject: {
                    resource: 'catalogs',
                    view: '77119b6b-ebf3-4b42-9a18-f0103c1602dc',
                    selectionMode: 'single', // multi
                    selectedObjectKeys: [],
                },
                title: 'Select catalog',
                allowCancel: true,
            };

            const catalogResult = await client?.showModal(templateModalOptions);
            //await client?.alert('catalog choosed result', '');
            // If catalog template was choosen
            if (!catalogResult.canceled && catalogResult.result.length > 0) {
                //await client?.alert('parsing catalog', '');
                const resObject = JSON.parse(catalogResult.result);
                if (resObject?.selectedObjectKeys.length > 0) {
                    catalogKey = resObject.selectedObjectKeys[0];
                    //await client?.alert('catalog key', catalogKey);
                    //await client?.alert('before searching for catalog name', catalogKey);
                    const catalog: any = await pepperi.resources.resource('catalogs').key(catalogKey).get();
                    //await client?.alert('after searching for catalog name', '');            
                    if (catalog?.ExternalID) {
                        catalogName = catalog.ExternalID;
                        //await client?.alert('finding catalog name', catalogName);     
                    }
                }
            }

            return catalogName;
        } catch (err: any) {
            //await client?.alert('caught exc', err?.message);
            throw new Error(err.message);
        }


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
                case 'surveys':
                    const newSurvey = await pepperi.resources.resource('Surveys').post({
                        Template: resourceTypeID,//templateKey
                        AccountUUID: this._accountUUID
                    });
                    debugger;
                    if (newSurvey?.Key) {
                        resource = {
                            id: newSurvey.Key
                        }
                    }
                    break;
            }
        } catch (err: any) {
            debugger;
            throw new Error(err.message);
        }


        debugger;
        return resource;
    }

}

export default VisitFlowService;