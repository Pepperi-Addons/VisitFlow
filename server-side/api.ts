import { Client, Request } from '@pepperi-addons/debug-server'
import { FlowService } from './services/flow.service';


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



