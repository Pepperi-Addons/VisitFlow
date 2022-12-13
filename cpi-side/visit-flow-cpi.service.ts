import _ from 'lodash';

interface IVisitFlowActivity {
    Group: string;
    ActivityType: number;
    ActivityData?: {};
    Title: string;
    Mandatory: boolean;
    Disabled?: boolean;
    Completed: string;
    Status: string;
    DepandsOnStep?: number;
}

class VisitFlowService {    
    private _collectionName = '';
    private _activeFlows: any[] = [];
    private _activities: any[] = [];
    private _transactions: any[] = [];
    private _serveys: any[] = [];

    constructor(name: string) {
        // this.loadActivities();
        this._collectionName = name;

    }

    async getFlows() {
        let flows: any[] = [];

        const res = await Promise.all([
            pepperi.resources.resource(this._collectionName).get({ where: 'Active = true' }),
            pepperi.api.activities.search({
                fields: ['UUID', 'Type', 'ActivityTypeID', 'StatusName', 'CreationDateTime'/*, 'TSAFlowId', 'TSAStartVisitDateTime', 'TSAEndVisitDateTime'*/],
                filter: {
                    ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'ThisWeek', Values: []
                }
            }),
            pepperi.api.transactions.search({
                fields: ['UUID', 'Type', 'ActivityTypeID', 'StatusName', 'CreationDateTime'/*, 'TSAFlowId', 'TSAStartVisitDateTime', 'TSAEndVisitDateTime'*/],
                filter: {
                    ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'ThisWeek', Values: []
                }
            })
        ]);
        console.log('data', res);

        debugger;

        if (res?.length === 3) {

            const activeFlows: any = res[0];
            const activities: any = res[1];

            //1 - get all active flows  
            //2 - check that you have at least one active flow 
            //3 - check that you have activities - if no just load the flow(s) with the steps
            //3 - in the activities seatch for an active flow - for that you need only the startEndFlow activity
            //3 - if found active - load it. else - show flows list (if only one found - load it)


            //found active flows
            if (activeFlows?.length) {
                //search for start/end flow activities        
                if (activities.success && activities.objects?.length) {
                    const strtEndActivities = activities.objects.filter(activity => activity.TSAFlowId);
                    let foundStartEndActivity = false;
                    for (let activity of strtEndActivities) {
                        //TODO waiting for answers
                        if (activity.TSAFlowId && activity.TSAStartVisitDateTime && !activity.TSAEndVisitDateTime) {
                            //activity in progress - even of 
                            const flowInProgress = activeFlows.find(flow => flow.UUID === activity.TSAFlowId);
                            if (flowInProgress) {
                                foundStartEndActivity = true;
                                //load flow statuses from activities
                                flows = this.createVisitFlows([flowInProgress], activities, true);
                            }
                        }
                    }
                    if (!foundStartEndActivity) {
                        //just load the flow(s) with the steps
                        flows = this.createVisitFlows(activeFlows);
                    }
                } else {
                    //no activites - just load the flow(s) wish the steps
                    flows = this.createVisitFlows(activeFlows);
                }
            } else {
                //no flows at all
            }

        }

        console.log('flows', flows);
        return flows;

    }

    private createVisitFlows(flows: any[], activities: any[] = [], searchActivity = false) {
        let visitFlows: any[] = [];                

        for (let flow of flows) {
            const steps = flow.steps;
            let visitActivities: IVisitFlowActivity[] = []; 
            for (let i = 0; i < steps.length; i++) {
                visitActivities.push({
                    Group: steps[i].Group,
                    ActivityType: steps[i].ActivityType,
                    Title: steps[i].Title,
                    Mandatory: steps[i].Mandatory,
                    Disabled: steps[i].Disabled === true,
                    Status: this.getActivityStatus(activities, steps[0].ActivityType, searchActivity),
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
       
        return visitFlows;
    }

    //check if there is an activity of the same type and return its status
    private getActivityStatus(activities: any[], activityType: string, searchActivity: boolean): string {
        let status = 'New';

        if (!searchActivity) {
            return status;
        }

        const activity = activities.find(activity => activity.ActivityTypeId === activityType);
        if (activity) {
            status = activity.StatusName;
        }

        return status;
    }

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



}

export default VisitFlowService;