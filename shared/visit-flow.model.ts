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
// **********************************************************************************************

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

export type VisitFlowResourceType =
    'activities'
    | 'transactions'
    | 'surveys'


