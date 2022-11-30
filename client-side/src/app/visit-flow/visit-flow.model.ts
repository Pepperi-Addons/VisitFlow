
export interface IVisitFlow {
    id: string;
    //activities: IVisitFlowActivity[];
    activityGroups: IVisitFlowActivityGroup[];
}

export interface IVisitFlowActivityGroup {
    type: string,
    activities: IVisitFlowActivity[]
}


export interface IVisitFlowActivity {    
    ActivityId: string;
    StepId: string;
    Group: string;
    ObjectType: VisitFlowActivityType;
    Catalog?: string;
    Title?: string;
    Mandatory: boolean;    
    Enabled: boolean;   
    Completed: string;
    Status: string;
    DepandsOnStep?: number;
    [key: string]: any;
}

export type VisitFlowActivityType =
    'GeneralActivity'
    | 'Transaction'
    | 'Survey'

