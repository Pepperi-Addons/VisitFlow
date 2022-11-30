import _ from 'lodash';

class VisitFlowService {
    private _activities: any[] = [];

    constructor() {
        this.loadActivities();

    }

    private loadActivities() {
        this._activities = [
            {
                group: 'Start',
                id: 'GA311422',
                order: 1,
                objectType: 'GeneralActivity',
                title: 'Start Visit',
                isMandatory: true,
                isEnabled: true,
                status: 'inCreation'
            },
            {
                group: 'Check',
                id: 'GA12121',
                order: 2,
                objectType: 'GeneralActivity',
                title: 'Complaiance',
                isMandatory: true,
                isEnabled: true,
                status: 'inCreation'
            },
            {
                group: 'Check',
                id: 'GA23232',
                order: 3,
                objectType: 'GeneralActivity',
                title: 'Complaiance Step 2',
                isMandatory: true,
                isEnabled: true,
                status: 'inCreation'
            },
            {
                group: 'Survey',
                id: 'SRV11111',
                order: 4,
                objectType: 'Survey',
                title: 'Survey 1',
                isMandatory: true,
                isEnabled: true,
                status: 'inCreation'
            },
            {
                group: 'Survey',
                id: 'SRV22222',
                order: 5,
                objectType: 'Survey',
                title: 'Survey 2',
                isMandatory: true,
                isEnabled: true,
                status: 'inCreation'
            },
            {
                group: 'Transactions',
                id: 'OA343434',
                order: 6,
                objectType: 'Transaction',
                title: 'Sales Order',
                isMandatory: true,
                isEnabled: true,
                status: 'inCreation'
            },
            {
                group: 'Transactions',
                id: 'OA556565',
                order: 7,
                objectType: 'Transaction',
                title: 'Coffee Order',
                isMandatory: true,
                isEnabled: true,
                status: 'inCreation'
            },
            {
                group: 'Returns',
                id: 'OA767677',
                order: 8,
                objectType: 'Transaction',
                title: 'Return',
                isMandatory: true,
                isEnabled: true,
                status: 'inCreation'
            },
            {
                group: 'Returns',
                id: 'OA898988',
                order: 9,
                objectType: 'Transaction',
                title: 'Return 2',
                isMandatory: true,
                isEnabled: true,
                status: 'inCreation'
            }
        ]
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