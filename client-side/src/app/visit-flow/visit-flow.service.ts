import { Injectable, ɵɵsetComponentScope } from '@angular/core';
import { IVisitFlow, IVisitFlowActivity, VisitFlowActivityType } from './visit-flow.model';
import { AppService } from '../app.service';
import _ from 'lodash';
import { map, tap, catchError } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { PepAddonService } from '@pepperi-addons/ngx-lib';


@Injectable({
    providedIn: 'root'
})
export class VisitFlowService {
    private _flows = new BehaviorSubject<any[]>([]);
    private _flows$ = this._flows.asObservable();
    //private _collectionFlows: any[] = [];
    private _visits: any[] = [];
    private _selectedVisit: {} | null = null;
    private _visitFlow: any = {};
    private _flowId: string;
    private _flowGroups: any[] = [];
    private _selectedGroupActivities: any[] = [];

    //collectionFlow$ = this._collectionFlow$.asObservable();
    /*get collectionFlows$(): Observable<any[]> {
        return this._flows$;
    }*/
  
    get visits() {
        return this._visits;
    }
    
    set visits(list: any[]) {
        this._visits = list;
    }

    get flows$() {
        return this._flows$;
    }

    set selectedFlow(value) {
        this._selectedVisit = value;
    }

    get selectedFlow() {
        return this._selectedVisit;
    }

    set flowId(id: string) {
        this._flowId = id;
    }

    get flowId() {
        return this._flowId;
    }

    get flowGroups() {
        return this._flowGroups;
    }

    set selectedGroupActivities(val) {
        this._selectedGroupActivities = val;
    }

    get selectedGroupActivities() {
        return this._selectedGroupActivities;
    }

    loadVisits(collection: string) {
        console.log('loadVisits', collection);
        //this._collectionFlows = [];
        /*const eventData = {
            detail: {
                eventKey: 'OnClientVisitsLoad',
                eventData: {
                    collection: collection
                },
                completion: (flows) => {
                    console.log('flows loaded 2', flows);
                    //this._collectionFlows = flows;                    
                    this._flows.next(flows);
                }
            }
        }
        const customEvent = new CustomEvent('emit-event', eventData);
        window.dispatchEvent(customEvent);*/
        //
        return this._addonService.emitEvent('OnClientVisitsLoad', {
            collection: collection
        });
        /*
        const eventData = {
            detail: {
                eventKey: 'OnClientFlowsLoad',
                eventData: {
                    collection: collection
                },
                completion: (flows) => {
                    console.log('flows loaded 2', flows);
                    //this._collectionFlows = flows;
                    console.log('is array',Array.isArray(flows));
                    this._flows.next(flows);
                }
            }
        }
        const customEvent = new CustomEvent('emit-event', eventData);
        window.dispatchEvent(customEvent); */
        //temp      
         /*
        return this._appService.getPapiCall(`/user_defined_collections/${collection}`).pipe(
            map(flows => flows.map(flow => {
                console.log('pre flow', flow);
                return {
                    key: flow.Key,
                    name: flow.Name,                    
                    steps: flow.steps
                }
            })),
            tap(flows => {
                //this._flows = flows;
                console.log('flows', flows);
                if (flows?.length) {
                    //TODO check if there is an active flow
                    
                }
            }),
           // catchError(err => this._collectionFlows = [])
        ); */
    }

    constructor(private _appService: AppService, private _addonService: PepAddonService) {
        //temp - load from DB
        this.initFlow();
        //TEMP
        //console.log('init flows 2', this.reinitFlow());
        //TEMP
        /*const groupBy = (array, key) => {
            return array.reduce((result, currentValue) => {
                (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);

                return result;
            }, {});
        }
        console.log('local group by', groupBy(this._visitFlow.activities, 'group'));*/
    }

    loadActivities() {
        //console.log('trigger cpi event from client');
        const eventData = {
            detail: {
                eventKey: 'OnVisitLoad',
                eventData: {},
                completion: (groups) => {
                    console.log('groups init return', groups);
                    //TEMP
                    this._flowGroups = this.reinitFlow();
                    //this._flowGroups = groups;
                    //console.log('type', typeof this._flowGroups);
                    console.log('_flowGroups', this._flowGroups);
                    if (this._flowGroups) {
                        //TEMP - select the first active group
                        for (let i = 0; i < this._flowGroups.length; i++) {
                            if (this._flowGroups[i].isActive) {
                                this._selectedGroupActivities = this._flowGroups[i].activities;
                                break;
                            }
                        }
                        //console.log('this._selectedGroupActivities', this._selectedGroupActivities);                    
                    }
                    /*this._flowGroups = groups;
                    if (groups) {
                        this._selectedGroupActivities = Object.values(groups)[0]; //TODO set the first group comtaining open (incomplete) activities
                        console.log('this._selectedGroup', this._selectedGroupActivities);
                    }*/

                }
            }
        };
        const customEvent = new CustomEvent('emit-event', eventData);
        window.dispatchEvent(customEvent);
    }

    handleActivityClicked(activity) {
        //TODO - check how to fetch the activity uuid - neew to create new ?
        const url = this.getActivityUrl(activity.id);
        if (url) {
            const eventData = {
                detail: {
                    eventKey: 'OnVisitActivityClick',
                    eventData: {
                        url: url
                    }
                }
            };
            const customEvent = new CustomEvent('emit-event', eventData);
            window.dispatchEvent(customEvent);
        }
    }

    initFlow() {
        this._visitFlow = {
            id: 'flowAbc',
            activities: [
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
    }

    recalculateFlow() {
        this.reinitFlow();
    }

    private reinitFlow() {
        //TODO - move to script        
        //get activities from api
        const activities = this._visitFlow.activities; //temp
        //update activities status
        //TODO
        //sort activities by order
        /*activities.sort((a, b) => {
            if (a.order > b.order) {
                return 1;
            }
            if (a.order < b.order) {
                return -1;
            }
            return 0;
        }); */

        //temp
        function getRandomMinMax(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min);
        }

        const random = getRandomMinMax(1, 9);

        for (let i = 0; i < random; i++) {
            activities[i].status = 'Submitted';
        }
        //temp

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
            .value()
        //return _.groupBy(activities, activity => activity.group).sortBy();

        //activity UUID - ce41efae-0c09-47b0-9de8-225d1e5f1ec1


    }

    private getActivityUrl(id: string) {       
        if (id) {
            if (id.indexOf('GA') > -1) {
                //const param = id.replace('GA_', '');
                const param = 'ce41efae-0c09-47b0-9de8-225d1e5f1ec1';
                return `/activities/details/${param}`;
            }
            if (id.indexOf('OA') > -1) {
                //const param = id.replace('OA_', '');
                const param = 'ce41efae-0c09-47b0-9de8-225d1e5f1ec1';
                return `/activities/details/${param}`;
            }
            if (id.indexOf('SRV') > -1) {
                //const param = id.replace('SRV_', '');
                const param = 'ce41efae-0c09-47b0-9de8-225d1e5f1ec1';
                return `/activities/details/${param}`;
            }
        }

        return null;
    }

}