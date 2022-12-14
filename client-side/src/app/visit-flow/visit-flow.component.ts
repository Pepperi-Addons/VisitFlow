import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VisitFlowService } from './visit-flow.service';
import { of } from 'rxjs';


@Component({
    selector: 'page-visit-flow',
    templateUrl: './visit-flow.component.html',
    styleUrls: ['./visit-flow.component.scss']
})
export class VisitFlowComponent implements OnInit {
    private _flowId = '';
    @Input()
    set hostObject(value: any) {
        console.log('hostObject', value);
        if (value?.configuration?.udcFlow) {
            //load flows
            this.flows2$ = this._visitFlowService.loadVisits(value.configuration.udcFlow);
            this._visitFlowService.loadVisits(value.configuration.udcFlow).then(
                res => {
                    console.log('promise res', res);
                    if (res?.visits) {
                        this._visitFlowService.visits = res.visits;
                    }
                    //this.flows3 = res?.visits;
                    
                }
            )
            /*this._visitFlowService.initUdcFlows(value.configuration.udcFlow).subscribe(res => {
                console.log('_visitFlowService', res[0]);    
                console.log('service flows', this._visitFlowService.flows);
                //let steps = JSON.parse(this._visitFlowService.flows[0].steps);
                //console.log('steps', steps);
            });*/
            //this.selectedUdcFlow = value.configuration.udcFlow;
        } else {
           // no udc selected;
        }

        /*
        if (value && value.coniguration && Object.keys(value.coniguration).length) {
            this._visitFlowService.flowId = value.coniguration.key;
            //this.loadFlow();
        }*/
    }
    //get flow id
    
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    get visits() {
        return this._visitFlowService.visits;
    }

    get flows4$() {
        return this._visitFlowService.flows$;
    } 

    get selectedVisit() {
        return this._visitFlowService.selectedFlow;
    }

    get flowId() {
        return this._visitFlowService.flowId;
    }

    get flowGroups() {
        return this._visitFlowService.flowGroups;
    }

    get selectedGroupActivities() {
        return this._visitFlowService.selectedGroupActivities;
    }

    flows$;
    flows2$: Promise<{
        visits: []
    }>;
    flows3: any[];
    

    constructor(private translate: TranslateService, private _visitFlowService: VisitFlowService) {
        /*this.flows$ = this._visitFlowService.flows$.subscribe(res => {
            console.log('list changed', res);
            this.flows$ = of(res);
        });*/
    }

    ngOnInit(): void {
        console.log('block works 2');
        this._visitFlowService.loadActivities();        
        // console.log('getRandom', this.getRandom());
    }
    /*
        getRandom() {
            function getRandomMinMax(min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min) + min);
            }
    
            const random = getRandomMinMax(1, 9);
            
            console.log('random', random);
        }*/

    ngOnChanges(e: any): void {

    }

    loadActivities() {
        //run recalculate script

    }

    /*
    onActivityClicked(activity) {
        //TODO - check how to fetch the activity uuid
        this._visitFlowService.handleActivityClicked(activity);
        
    } */

    onVisitSelected(flow) {
        console.log('onFlowSelected', flow);
        this._visitFlowService.selectedFlow = flow;
    }

    /*
    onGroupClicked(group) {
        console.log('onGroupClicked', group);
        this._visitFlowService.selectedGroupActivities = group.activities;
    }

    onActivityClicked(activity) {
        console.log('onActivityClicked', activity);
        //TODO - check how to fetch the activity uuid
        this._visitFlowService.handleActivityClicked(activity);
    }*/

}
