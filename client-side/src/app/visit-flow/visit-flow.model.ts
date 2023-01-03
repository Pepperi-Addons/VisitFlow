
export interface IVisitFlow {  
    Key: string;    
    Title: string;
    InProgress: boolean;    
    Groups: IVisitFlowGroup[]    
}

export interface IVisitFlowGroup {
    Title: string;
    Steps: IVisitFlowStep[]; 
}

export interface IVisitFlowStep {
    Title: string;
    ResourceType: VisitFlowResourceType;
    ResourceTypeID: string;
    Activities: string[];
    Mandatory: boolean;
    Disabled?: boolean;
    Completed: boolean;
    DepandsOnStep?: number;
    [key: string]: any;
}

/*
export interface IVisitFlowActivityGroup {
    Title: string;
    Steps: IVisitFlowStep[]; 
}

export interface IVisitFlowActivity {    
    //ActivityId: string;
    //StepId: string;
    Group: string;
    Activities: string[],
    ResourceType: VisitFlowActivityType;
    ResourceTypeID: string;
    //ObjectType: VisitFlowActivityType;
    //Catalog?: string;
    Title: string;
    Mandatory: boolean;    
    Disabled?: boolean;   
    Completed: boolean;  
    Starter?: boolean;  
    DepandsOnStep?: number;
    [key: string]: any;
}*/

export type VisitFlowResourceType =
    'activities'
    | 'transactions'
    | 'surveys'

