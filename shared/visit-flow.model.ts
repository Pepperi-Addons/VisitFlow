export const VISIT_FLOWS_TABLE_NAME = 'VisitFlows';
export const VISIT_FLOWS_BASE_TABLE_NAME = 'visit_flows'; 
export const VISIT_FLOW_GROUPS_TABLE_NAME = 'VisitFlowGroups';
export const VISIT_FLOW_GROUPS_BASE_TABLE_NAME = 'visit_flow_groups'; 
export const VISIT_FLOW_STEPS_TABLE_NAME = 'VisitFlowSteps';
export const VISIT_FLOW_STEPS_BASE_TABLE_NAME = 'visit_flow_steps'; 
export const VISIT_FLOW_MAIN_ACTIVITY = 'VF_VisitFlowMainActivity';

// **********************************************************************************************
//                          Client & User events const
// **********************************************************************************************
export const CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_LOAD = 'OnClientVisitFlowLoad';
export const USER_ACTION_ON_VISIT_FLOW_LOAD = 'OnVisitFlowViewLoad';

export const CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK = 'OnClientVisitFlowStepClick';
export const USER_ACTION_ON_VISIT_FLOW_STEP_CLICK = 'OnVisitFlowStepClick';

export const CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_GROUP_CLICK = 'OnClientVisitFlowGroupClick';
export const USER_ACTION_ON_VISIT_FLOW_GROUP_CLICK = 'OnVisitFlowGroupClick';
// **********************************************************************************************

export interface IVisitFlow {  
    Key: string;    
    Title: string;    
    Groups: IVisitFlowGroup[];
    [key: string]: any;    
}

export interface IVisitFlowGroup {
    Title: string;
    Steps: IVisitFlowStep[]; 
    [key: string]: any;  
}

export interface IVisitFlowStep {
    Title: string;
    Resource: VisitFlowResource;
    ResourceCreationData: string;
    BaseActivities: string[];
    Mandatory: boolean;
    Disabled?: boolean;
    Completed: boolean;
    CompletedStatusName: any; // can be string on old steps scheme or array with the new scheme (ver 0.6.2)
    DepandsOnStep?: number;
    [key: string]: any;
}

export interface IVisitFlowSelectedStep {
    GroupIndex: number,
    StepIndex: number;
}

export type VisitFlowResource =
    'activities'
    | 'transactions'
    | 'surveys'


