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
     * @param resourceName udc resource name
     * @returns visit flow(s)
     */
    async getVisits(resourceName: string) {
        const inProgressVisit = await this.getInProgressVisitFlow(resourceName);
        return this.createVisitFlows(inProgressVisit);
    }

    /**
     * get in-progress visit if exists, null otherwise
     * @param resourceName udc resource name
     * @returns in-progress visit object
     */
    private async getInProgressVisitFlow(resourceName: string) {
        let inProgressVisit: IInProgressVisit | null = null;

        try {
            const res: any = await Promise.all([
                pepperi.resources.resource(resourceName).get({ where: 'Active = true' }),
                this.getStartEndActivitiesPromise()
            ]);
            debugger;
            if (res?.length === 2 && res[0].length) {
                this._activeVisits = res[0];
                //console.log('start end activitiies found', res[1].objects?.length);
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
            return this.convertToVisitGroups(udcVisits, inProgressVisit);
            //debugger;
            //visitFlows = await this.convertToVisitFlows(udcVisits);
           // debugger;

           // return visitFlows;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    private async convertToVisitGroups(visits: any[], inProgress: IInProgressVisit | null) {
        let udcGroups: any[] = [];
        let groupedVisits: any[] = [];
        let res: any = await pepperi.resources.resource(VISIT_FLOW_GROUPS_TABLE_NAME).search({
            Fields: ['Key', 'Title', 'SortIndex']
        });

        if (res?.Objects?.length) {
            udcGroups = res.Objects;
        }
        //     
        for (let visit of visits) {
            let steps = visit.steps;
            //sort steps by group SortIndex   
            if (udcGroups?.length) {
                steps.sort((a, b) => {
                    const groupA = udcGroups.find(group => group.Key === a.Group);
                    const groupB = udcGroups.find(group => group.Key === b.Group);
                    if (groupA && groupA.SortIndex >= 0 && groupB && groupB.SortIndex >= 0) {
                        return groupA.SortIndex - groupB.SortIndex;
                    } else {
                        return 0;
                    }
                });
            }
            //            
            let starterFound = false;
            let mandatoryIncompleteFound = false;
            for (let i = 0; i < steps.length; i++) {
                //let step: any = _.clone(steps[i]);
                if (inProgress) {
                    //TODO if startActivity incomplete disable all but set the item in BaseActivities
                    // const item = await this.getResourceItem(
                    //     steps[i].Resource,
                    //     steps[i].ResourceCreationData,
                    //     inProgress.CreationDateTime ? inProgress.CreationDateTime : ''
                    // );
                    // steps[i].BaseActivities = item ? [item.UUID] : [];
                    const items = await this.getResourceItem(
                        steps[i].Resource,
                        steps[i].ResourceCreationData,
                        inProgress.CreationDateTime ? inProgress.CreationDateTime : ''
                    );
                    steps[i].BaseActivities = items.map(i => i?.UUID);
                    
                    steps[i].Completed = this.isStepCompleted(
                        items[0],
                        steps[i].Completed);
                    //in case of an imcomplete mandatory activity - lock End activity
                    if (
                        steps[i].Mandatory &&
                        !steps[i].Completed &&
                        (steps[i].Resource !== 'activities' ||
                            steps[i].ResourceCreationData !== VISIT_FLOW_MAIN_ACTIVITY)
                    ) {
                        mandatoryIncompleteFound = true;
                    }
                } else {
                    steps[i].BaseActivities = [];
                    steps[i].Completed = false;
                    //in case visit isn't in progress - disable all steps except for the start step
                    if (steps[i].Resource === 'activities' && steps[i].ResourceCreationData === VISIT_FLOW_MAIN_ACTIVITY && !starterFound) {
                        steps[i].Disabled = false;
                        starterFound = true;
                    } else {
                        steps[i].Disabled = true;
                    }
                }

            }
            //debugger;
            if (mandatoryIncompleteFound) {
                this.lockEndActivity(steps);
            }

            let groups = _(steps)
                .groupBy(step => step.Group)
                .map(group => {
                    return {
                        Key: group[0].Group,
                        Title: this.getGroupTitle(udcGroups, group[0].Group),
                        Steps: group
                    }
                })
                .value();

            groupedVisits.push({
                Key: visit.Key,
                Title: visit.Name, //change from description to name for DI-22805
                Groups: groups
            });
        }

        return groupedVisits;
    }

    /**
     * disable end visit activity
     * @param steps 
     */
    private lockEndActivity(steps: any[]) {
        for (let i = steps.length - 1; i >= 0; i--) {
            if (
                steps[i].Resource === 'activities' &&
                steps[i].ResourceCreationData === VISIT_FLOW_MAIN_ACTIVITY
            ) {
                steps[i].Disabled = true;
                break;
            }
        }
    }

    /*
    private async convertToVisitFlows(udcVisits: any[]) {
        let visits: IVisitFlow[] = [];
        let udcGroups: any[] = [];

        try {
            let res: any = await pepperi.resources.resource(VISIT_FLOW_GROUPS_TABLE_NAME).search({
                Fields: ['Key', 'Title', 'SortIndex']
            });
            //debugger;

            if (res?.Objects?.length) {
                udcGroups = res.Objects;
            }

            for (let visit of udcVisits) {
                let groups = _(visit.steps)
                    .groupBy(step => step.Group)
                    .map(group => {
                        return {
                            Key: group[0].Group,
                            Title: this.getGroupTitle(udcGroups, group[0].Group),
                            Steps: group
                        }
                    })
                    .value();
                //debugger;
                //in case VISIT_FLOW_GROUPS_TABLE_NAME is defined - use it to sort the groups
                if (udcGroups?.length) {
                    const sortedGroups = groups.sort((a, b) => {
                        const groupA = udcGroups.find(item => item.Key === a.Key);
                        const groupB = udcGroups.find(item => item.Key === b.Key);
                        if (groupA && groupA.SortIndex >= 0 && groupB && groupB.SortIndex >= 0) {
                            return groupA.SortIndex - groupB.SortIndex;
                        } else {
                            return 0;
                        }
                    });
                    groups = sortedGroups;
                }
                //debugger;
                visits.push({
                    Key: visit.Key,
                    Title: visit.Description,
                    Groups: groups
                });
            }

            return visits;
        } catch (err: any) {
            debugger;
            throw new Error(err.message);
        }
    } */

    private getGroupTitle(groups, key) {
        const item = groups.find(group => group.Key === key);
        return item ? item.Title : 'N/A';
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

    private async getResourceItem(resource: string, resourceCreationData: string, creationDateTime: string) {
        try {
            let startDateTime = creationDateTime ? creationDateTime : this.getToday();
            let item: any | null = null;
            let res: any;
            let items: any[] = [];

            switch (resource) {
                case 'activities':
                    res = await pepperi.api.activities.search({
                        fields: ['UUID', 'StatusName', 'CreationDateTime'],
                        filter: {
                            Operation: 'AND',
                            LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: [] },
                            RightNode: {
                                Operation: 'AND',
                                LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [this._accountStr] }
                                , RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceCreationData] }
                            }
                        },
                        sorting: [{ Field: 'CreationDateTime', Ascending: false }],
                        pageSize: 1
                    });
                    //debugger;
                    if (res?.success && res.objects?.length) {
                        if (creationDateTime) {
                            if (res.objects[0].CreationDateTime >= creationDateTime) {
                                item = res.objects[0];
                            }
                        } else {
                            item = res.objects[0];
                        }

                        items = res.objects;
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
                                , RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceCreationData] }
                            }
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

                        items = res.objects;
                    }
                    break;
                default:
                    res = await pepperi.resources.resource(resource).search({
                        Fields: ['Key', 'StatusName', 'CreationDateTime', 'Account'],
                        Where: `Template='${resourceCreationData}' And Account='${this._accountUUID}' And CreationDateTime >= '${startDateTime}'`

                    });
                    debugger;
                    if (res?.Objects?.length) {
                        debugger;

                        //let templates: any[] = res.Objects.filter(template => template.CreationDateTime >= startDateTime);
                        let templates: any[] = res.Objects;
                        debugger;
                        if (templates.length) {
                            templates.sort((a, b) => {
                                if (a.CreationDateTime > b.CreationDateTime) {
                                    return -1;
                                } else if (a.CreationDateTime < b.CreationDateTime) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            })
                            item = {
                                UUID: templates[0].Key,
                                StatusName: templates[0].Status || ''
                            }

                            items = templates;
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

            // return item;
            if (items.length > 0 && item !== null) {
                items[0] = item;
            } else {
                items.push(null);
            }

            return items;
        } catch (err: any) {
            debugger;
            throw new Error(err.message);
            //return null;
        }
    }

    async getStepUrl(client: IClient, step: any, visitUUID: string) {
        if (step?.Resource === 'activities' && step?.ResourceCreationData === VISIT_FLOW_MAIN_ACTIVITY) {
            return this.getStartVisitUrl(step, visitUUID);
        } else {
            return this.getActivityUrl(client, step);
        }
    }

    /**
     * returns startEnd activity, if exists return the item otherwise creates a new one
     * @param visitUUID 
     * @returns 
     */
    private async getStartVisitUrl(step: any, visitUUID: string) {
        try {
            let url = '/activities/details/';
            let activity: any = null;

            debugger;
            if (step?.BaseActivities?.length) {
                url += step.BaseActivities[0];
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

    private async getActivityUrl(client: IClient, step: any) {
        let url = this.getBaseUrl(step.Resource);
        let resource: any;
        let catalogName = '';

        try {
            // = await this.getResourceItem(Resource, ResourceCreationData, creationDateTime);            
            debugger;
            if (step?.BaseActivities?.length) {
                return url + step.BaseActivities;
            } else {
                if (step.Resource === 'transactions') {
                    catalogName = await this.chooseCatalog(client);
                    //await client?.alert('outer choose catalog', catalogName);
                    /*if (!catalogName) {                                             
                        throw new Error('Catalog was not selected');
                    } */
                }
                debugger;
                const newResource = await this.createResource(step.Resource, step.ResourceCreationData, catalogName);
                debugger;
                if (newResource?.id) {
                    return url + newResource.id;
                } else {
                    throw new Error(`Resource ${step.ResourceCreationData} was not created`);
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

    private getBaseUrl(resource: string) {
        switch (resource) {
            case 'activities':
                return `/${resource}/details/`;
            case 'transactions':
                return `/${resource}/scope_items/`;
            default:
                return 'surveys?survey_key=';
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
                    //view: '77119b6b-ebf3-4b42-9a18-f0103c1602dc',
                    selectionMode: 'single', // multi
                    selectedObjectKeys: [],
                },
                title: 'Select catalog',
                allowCancel: true,
            };

            const catalogResult = await client?.showModal(templateModalOptions);
            //await client?.alert('catalog choosed result', '');
            // If catalog template was choosen
            if (!catalogResult.canceled) {
                if (catalogResult.result.length > 0) {
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
                } else {
                    throw new Error('Catalog was not selected');
                }
            }

            return catalogName;
        } catch (err: any) {
            //await client?.alert('caught exc', err?.message);
            throw new Error(err.message);
        }


    }

    private async createResource(resource: string, resourceCreationData: string, catalogName: string = '') {
        let item: any = null;

        try {
            switch (resource) {
                case 'activities': {
                    item = await pepperi.app.activities.add({
                        type: {
                            Name: resourceCreationData
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
                    item = await pepperi.app.transactions.add({
                        type: {
                            Name: resourceCreationData
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
                default:
                    const newSurvey = await pepperi.resources.resource(resource).post({
                        Creator: '00000000-0000-0000-0000-000000000000', //TEMP
                        Template: resourceCreationData,//templateKey
                        Account: this._accountUUID,
                        StatusName: 'InCreation' //TEMP
                    });
                    debugger;
                    if (newSurvey?.Key) {
                        item = {
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
        return item;
    }

}

export default VisitFlowService;