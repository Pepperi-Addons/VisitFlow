import { Client, Request } from '@pepperi-addons/debug-server'
import { VisitFlowApiService } from './services/visit-flow-api.service';
import { FlowService } from './services/flow.service';
import { 
    VISIT_FLOWS_BASE_TABLE_NAME,
    VISIT_FLOW_GROUPS_BASE_TABLE_NAME
 } from 'shared'; 
 // import { UtilsService } from 'shared/services/utils.service';

export async function visit_flows(client: Client, request: Request) {
    try {
        const service = new VisitFlowApiService(client, request);
        const resource = service.getResourceService(VISIT_FLOWS_BASE_TABLE_NAME);  
        //const utilsService = new UtilsService(request);
        const findOptions = service.buildFinOptionsQuery();      
        return resource.getResources(findOptions);
    } catch(err) {
        throw err;
    }
}

export async function get_visit_flows_by_key(client: Client, request: Request) {
    try{
        const service = new VisitFlowApiService(client, request);
        const resource = service.getResourceService(VISIT_FLOWS_BASE_TABLE_NAME);
        return resource.getResourceByKey(request.query.key);
    } catch(err) {
        throw err;
    }
}

export async function visit_flows_search(client: Client, request: Request) {
    try {
        const service = new VisitFlowApiService(client, request);
        const resource = service.getResourceService(VISIT_FLOWS_BASE_TABLE_NAME);
        return resource.searchResources(request.body);
    } catch(err) {
        throw err;
    }
}

export async function visit_flows_groups(client: Client, request: Request) {
    try{
        const service = new VisitFlowApiService(client, request);
        const resource = service.getResourceService(VISIT_FLOW_GROUPS_BASE_TABLE_NAME);    
        //const utilsService = new UtilsService(request);
        const findOptions = service.buildFinOptionsQuery();  
        return resource.getResources(findOptions);
    } catch(err) {
        throw err;
    }
}

export async function get_visit_flow_groups_by_key(client: Client, request: Request) {
    try {
        const service = new VisitFlowApiService(client, request);
        const resource = service.getResourceService(VISIT_FLOW_GROUPS_BASE_TABLE_NAME);
        return resource.getResourceByKey(request.query.key);
    } catch(err) {
        throw err;
    }
}

export async function visit_flow_groups_search(client: Client, request: Request) {
    try{
        const service = new VisitFlowApiService(client, request);
        const resource = service.getResourceService(VISIT_FLOW_GROUPS_BASE_TABLE_NAME);
        return resource.searchResources(request.body);
    } catch(err) {
        throw err;
    }
}

export async function visit_flow_user_events(client:Client, request: Request): Promise<any> {
    try {
        const service = new FlowService(client);
        let res;
        
        if (request.method === 'GET') {
            res = service.getVisitFLowUserEvents(request.query);
        } else {
            throw new Error(`Method ${request.method} is not supported.`);
        }

        return res;
    } catch(err) {
        throw err;
    }
}

export async function test(client: Client, request: Request) {
    return {
        Hello: 'World'
    }
};



