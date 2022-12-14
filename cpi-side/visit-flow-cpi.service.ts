import _ from 'lodash';

interface IVisitFlowActivity {
    Group: string;
    ResourceType: 'Activity' | 'Transaction' | 'Survey';
    ResourceTypeID: string;
    Title: string;
    Mandatory: boolean;
    Disabled?: boolean;
    Completed: string;
    Status: string;
    DepandsOnStep?: number;
}

class VisitFlowService {
    private _collectionName = '';
    private _activeVisits: any[] = [];
    private _activities: any[] = [];
    private _transactions: any[] = [];
    private _serveys: any[] = [];

    constructor(name: string) {
        // this.loadActivities();
        this._collectionName = name;

    }

    async getVisits() {
        let visits: any[] = [];

        const res: any = await Promise.all([
            pepperi.resources.resource(this._collectionName).get({ where: 'Active = true' }),
            pepperi.api.activities.search({
                fields: ['UUID', 'Type', 'ActivityTypeID', 'StatusName', 'CreationDateTime'/*, 'TSAFlowID', 'TSAStartVisitDateTime', 'TSAEndVisitDateTime'*/],
                filter: {
                    ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'ThisWeek', Values: []
                }
            }),
            pepperi.api.transactions.search({
                fields: ['UUID', 'Type', 'ActivityTypeID', 'StatusName', 'CreationDateTime'],
                filter: {
                    ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'ThisWeek', Values: []
                }
            })
            //TODO - fetch surveys
        ]);
        console.log('data', res);

        debugger;

        if (res?.length === 3) {

            this._activeVisits = res[0];
            if (res[1].success && res[1].objects?.length) {
                this._activities = res[1].objects;
            }
            if (res[2].success && res[2].objects?.length) {
                this._transactions = res[2].objects;
            }

            //1 - get all active flows  
            //2 - check that you have at least one active flow 
            //3 - check that you have activities - if no just load the flow(s) with the steps
            //3 - in the activities seatch for an active flow - for that you need only the startEndFlow activity
            //3 - if found active - load it. else - show flows list (if only one found - load it)


            //found active flows
            if (this._activeVisits?.length) {
                //search for start/end flow activities        
                if (this._activities.length) {
                    const strtEndActivities = this._activities.filter(activity => activity.TSAFlowID);
                    let foundStartEndActivity = false;
                    for (let activity of strtEndActivities) {
                        //TODO waiting for answers
                        if (activity.TSAFlowID && activity.TSAStartVisitDateTime && !activity.TSAEndVisitDateTime) {
                            //activity in progress - even of 
                            const flowInProgress = this._activeVisits.findIndex(flow => flow.UUID === activity.TSAFlowID);
                            if (flowInProgress >= 0) {
                                foundStartEndActivity = true;
                                //load flow statuses from activities
                                visits = this.createVisitFlows(flowInProgress, true);
                            }
                        }
                    }
                    if (!foundStartEndActivity) {
                        //just load the flow(s) with the steps
                        visits = this.createVisitFlows();
                    }
                } else {
                    //no activites - just load the flow(s) wish the steps
                    visits = this.createVisitFlows();
                }
            } else {
                //no flows at all
            }

        }

        console.log('visits', visits);
        return visits;

    }

    private createVisitFlows(flowInProgress = -1, searchActivity = false) {
        let visitFlows: any[] = [];
        let flows = flowInProgress >= 0 ? this._activeVisits[flowInProgress] : this._activeVisits;

        for (let flow of flows) {
            const steps = flow.steps;
            let visitActivities: IVisitFlowActivity[] = [];
            for (let i = 0; i < steps.length; i++) {
                visitActivities.push({
                    Group: steps[i].Group,
                    ResourceType: steps[i].ResourceType,
                    ResourceTypeID: steps[i].ResourceTypeID,
                    Title: steps[i].Title,
                    Mandatory: steps[i].Mandatory,
                    Disabled: steps[i].Disabled === true,
                    Status: this.getActivityStatus(steps[0].ResourceType, steps[0].ResourceTypeID, searchActivity),
                    Completed: steps[0].Completed
                } as IVisitFlowActivity);
            }
            visitFlows.push({
                Key: flow.Key,
                Name: flow.Name,
                Title: flow.Description,
                Activities: [...visitActivities]
            });
        }

        const isarr = Array.isArray(visitFlows);
        debugger;
        return visitFlows;
    }

    //check if there is an activity of the same type and return its status
    private getActivityStatus(resourceType: string, resourceTypeID: string, searchActivity: boolean): string {
        let status = 'New';
        let resource: any = null;

        if (!searchActivity) {
            return status;
        }

        switch (resourceType) {
            case 'Activity':
                resource = this._activities.find(activity => activity.ActivityTypeID == resourceTypeID);
                break;
            case 'Transaction':
                resource = this._transactions.find(transaction => transaction.ActivityTypeID == resourceTypeID);
                break;
            case 'Survey':
                //TODO
                break;
        }

        if (resource) {
            status = resource.StatusName;
        }

        return status;
    }

    /*
    //TEMP
    setRandomCompleted() {
        //New
        //InCreation
        //InPayment
        function getRandomMinMax(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min);
        }

        const random = getRandomMinMax(1, 9);

        for (let i = 0; i < random; i++) {
            this._activities[i].status = 'Submitted';
        }
    }

    getGroups() {
        //fetch activities from UDS
        const activities = this._activities; //temp
        //TODO - bulk fetch activities status        

        this.setRandomCompleted();
        //group activities by type

        return _(activities)
            .groupBy(activity => activity.group)
            .sortBy(group => activities.indexOf(group[0]))
            .map(group => {
                return {
                    name: group[0].group,
                    isActive: group.filter(activity => activity.status !== 'Submitted').length > 0,
                    activities: group
                }
            })
            .value();

    }
*/


}

export default VisitFlowService;