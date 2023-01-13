import '@pepperi-addons/cpi-node';
import VisitFlowService from './visit-flow-cpi.service';
import {
    CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_LOAD,
    USER_ACTION_ON_VISIT_FLOW_LOAD,
    CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK,
    USER_ACTION_ON_VISIT_FLOW_STEP_CLICK,
    VISIT_FLOW_MAIN_ACTIVITY,
    VISIT_FLOW_STEPS_TABLE_NAME
} from 'shared';

export async function load(configuration: any) {
    pepperi.events.intercept(CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_LOAD as any, {}, async (data): Promise<any> => {
        try {
            debugger;
            if (!data.ResourceName) {
                await data.client?.alert('Error', 'Resource was not selected');
                return {};
            } else if (!data.AccountUUID) {
                await data.client?.alert('Error', 'Account was not selected');
                return {};
            } else {
                const service = new VisitFlowService(data.AccountUUID);
                let visits: any[] = [];

                visits = await service.getVisits(data.ResourceName);
                debugger;
                const eventRes: any = await pepperi.events.emit(USER_ACTION_ON_VISIT_FLOW_LOAD, {
                    Visits: visits,
                    ObjectType: data.ResourceName
                }, data);

                if (eventRes?.Visits) {
                    visits = eventRes.Visits;
                }

                debugger;
                if (visits?.length) {
                    return {
                        Visits: visits
                    };
                } else {
                    await data.client?.alert('Error', 'Visits were not defined');
                    return {};
                }                               
            }

        } catch (err: any) {
            await data.client?.alert('Error:', err.message);
            return {};
        }

    });

    pepperi.events.intercept(CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK as any, {}, async (data): Promise<any> => {
        try {
            let inputData = {
                AccountUUID: data.AccountUUID,
                Visit: data.Visit,
                SelectedStep: data.SelectedStep
            }
            // Emit user event OnVisitFlowStepClick
            const eventRes: any = await pepperi.events.emit(USER_ACTION_ON_VISIT_FLOW_STEP_CLICK, {
                Data: inputData,
                ObjectType: VISIT_FLOW_STEPS_TABLE_NAME
            }, data);

            if (eventRes?.Data) {
                inputData = eventRes.Data;
            }

            const service = new VisitFlowService(inputData.AccountUUID);
            let url: string | undefined = undefined;
            //await data.client?.alert('OnClientVisitFlowStepClick account', data.AccountUUID);
            //await data.client?.alert('OnClientVisitFlowStepClick visit', data.VisitUUID);
            debugger;
            if (
                inputData?.SelectedStep?.GroupIndex >= 0 &&
                inputData.SelectedStep.StepIndex >= 0 &&
                inputData.Visit?.Groups?.length &&
                inputData.Visit.Groups[inputData.SelectedStep.GroupIndex]?.Steps?.length
            ) {
                const step = inputData.Visit.Groups[inputData.SelectedStep.GroupIndex].Steps[inputData.SelectedStep.StepIndex];
                debugger;
                url = await service.getStepUrl(data.client as any, step, inputData.Visit?.Key);
            }
            
            debugger;

            //await data.client?.alert('OnClientVisitFlowStepClick finish, url -', url);
            if (url) {
                await data.client?.navigateTo({ url: url });
            } else {
                return {};
            }
        } catch (err: any) {
            await data.client?.alert('Error:', err.message);
            return {};
        }
    });

}

export const router = Router()
router.get('/test', (req, res) => {
    res.json({
        hello: 'World'
    })
})