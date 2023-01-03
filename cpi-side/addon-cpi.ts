import '@pepperi-addons/cpi-node';
import VisitFlowService from './visit-flow-cpi.service';
import { 
    CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_LOAD,
    USER_ACTION_ON_VISIT_FLOW_LOAD,
    CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK,
    USER_ACTION_ON_VISIT_FLOW_STEP_CLICK,
    VISIT_FLOW_MAIN_ACTIVITY
 } from 'shared';

export async function load(configuration: any) {
    pepperi.events.intercept(CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_LOAD as any, {}, async (data): Promise<any> => {       
        try {
            debugger;
            const service = new VisitFlowService(data.AccountUUID);
            let visits: any[] = [];
            
            visits = await service.getVisits(data.UDCName);
            /*
            const inProgressVisit = await service.getInProgressVisitFlow(data.UDCName);
            debugger;            
            visits = await service.createVisitFlows(inProgressVisit); */
           
            // Emit user event OnVisitFlowViewLoad
            const eventRes: any = await pepperi.events.emit(USER_ACTION_ON_VISIT_FLOW_LOAD, {
                Visits: visits,
                ObjectType: data.UDCName
            }, data);

            if (eventRes?.Visits) {
                visits = eventRes.Visits;
            }
            
            debugger;
            return {
                Status: 'success',
                Visits: visits
            };
        } catch (err: any) {
            //TODO turn to .then .catch 
            await data.client?.alert('Error:', err.message);
            //throw new Error(err.message);
            return {
                Status: 'failure',
                Error: err.message
            };
        }

    });

    pepperi.events.intercept(CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK as any, {}, async (data): Promise<any> => {
        try {
            // Emit user event OnVisitFlowStepClick
            const eventRes: any = await pepperi.events.emit(USER_ACTION_ON_VISIT_FLOW_STEP_CLICK, {
                Step: data.Step,
                ObjectType: 'VisitFlowSteps'
            }, data);
            
            if (eventRes?.Step) {
                data.Step = eventRes.Step;
            }

            const service = new VisitFlowService(data.AccountUUID);
            let url: string | undefined = undefined;
            //await data.client?.alert('OnClientVisitFlowStepClick account', data.AccountUUID);
            //await data.client?.alert('OnClientVisitFlowStepClick visit', data.VisitUUID);
            debugger;
            if (data.Step?.ResourceType === 'activities' && data.Step?.ResourceTypeID === VISIT_FLOW_MAIN_ACTIVITY) {
                url = await service.getStartVisitUrl(data.Step, data.VisitUUID);
            } else {
                //await data.client?.alert('OnClientVisitFlowStepClick init', data.AccountUUID);
                url = await service.getActivityUrl(data.client as any, data.Step);
            }
            debugger;

            //await data.client?.alert('OnClientVisitFlowStepClick finish, url -', url);
            if (url) {
                await data.client?.navigateTo({ url: url });
            }
        } catch (err: any) {
            await data.client?.alert('Error:', err.message);
            debugger;
            throw new Error(err.message);
            /*return {
                Status: 'failure',
                Error: err.message
            };*/
        }
    });

}

export const router = Router()
router.get('/test', (req, res) => {
    res.json({
        hello: 'World'
    })
})