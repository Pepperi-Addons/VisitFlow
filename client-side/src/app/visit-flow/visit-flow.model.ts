
export interface IVisitFlow {
    /*
    id: string;
    //activities: IVisitFlowActivity[];
    activityGroups: IVisitFlowActivityGroup[];
    */
    Key: string;
    Name: string;
    Title: string;
    InProgress: boolean;
    CreationDateTime?: string;
    Activities: IVisitFlowActivity[];
}

export interface IVisitFlowActivityGroup {
    Name: string;
    Activities: IVisitFlowActivity[];
}


export interface IVisitFlowActivity {    
    //ActivityId: string;
    //StepId: string;
    Group: string;
    ResourceType: VisitFlowActivityType;
    ResourceTypeID: string;
    //ObjectType: VisitFlowActivityType;
    //Catalog?: string;
    Title?: string;
    Mandatory: boolean;    
    Disabled: boolean;   
    Completed: boolean;  
    Starter: boolean;  
    DepandsOnStep?: number;
    [key: string]: any;
}

export type VisitFlowActivityType =
    'activities'
    | 'transactions'
    | 'surveys'

