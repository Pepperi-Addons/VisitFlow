import '@pepperi-addons/cpi-node';
import { Request } from '@pepperi-addons/debug-server'
import VisitFlowService from './visit-flow-cpi.service';
import { PapiService } from './papi.service';
import {
    CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_LOAD,
    USER_ACTION_ON_VISIT_FLOW_LOAD,
    CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK,
    USER_ACTION_ON_VISIT_FLOW_STEP_CLICK,
    VISIT_FLOW_MAIN_ACTIVITY,
    VISIT_FLOWS_BASE_TABLE_NAME,
    VISIT_FLOW_STEPS_TABLE_NAME,
    VISIT_FLOW_GROUPS_BASE_TABLE_NAME,
    VISIT_FLOWS_TABLE_NAME
} from 'shared';
import { UtilsService } from './utils.service';

export async function load(configuration: any) {
    pepperi.events.intercept(CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_LOAD as any, {}, async (data): Promise<any> => {
        try {
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
                
                if (visits.length === 0) {
                    await data.client?.alert('Error', 'Visits were not defined');
                    return {};
                }
                const eventRes: any = await pepperi.events.emit(USER_ACTION_ON_VISIT_FLOW_LOAD, {
                    Data: {           
                        AccountUUID: data.AccountUUID,             
                        Visits: visits                        
                    },
                    ObjectType: data.ResourceName                    
                }, data);

                if (eventRes?.data?.Visits) {
                    visits = eventRes.data.Visits;
                }
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
            let visit: any = {}
            const visitkey = inputData.Visit?.Key || '';
            try {
                const res = (await pepperi.resources.resource(VISIT_FLOWS_BASE_TABLE_NAME).search({KeyList: [visitkey], Fields: ['ResourceName']})).Objects || [];
                if(res?.length > 0) {
                    visit = res[0];
                }

            }
            catch (err) {
                console.log(`could not found visit with key ${visitkey}`);
            }
            // Emit user event OnVisitFlowStepClick
            const eventRes: any = await pepperi.events.emit(USER_ACTION_ON_VISIT_FLOW_STEP_CLICK, {
                Data: inputData,
                ObjectType: visit.ResourceName
            }, data);

            if (eventRes?.data?.Data) {
                inputData = eventRes.data.Data;
            }

            const service = new VisitFlowService(inputData.AccountUUID);
            let url: string | undefined = undefined;

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
});

router.get(`/${VISIT_FLOWS_BASE_TABLE_NAME}`, async (req, res) => {
    const service = new PapiService(VISIT_FLOWS_BASE_TABLE_NAME);
    const utilsService = new UtilsService(req);
    const findOptions = utilsService.buildFinOptionsQuery();
    const visits = await service.getResources(findOptions);

    res.json(visits);
});

router.get(`/${VISIT_FLOWS_BASE_TABLE_NAME}/key/:key`, async (req, res) => {
    const service = new PapiService(VISIT_FLOWS_BASE_TABLE_NAME);
    const visits = await service.getResourceByKey(req.params.key);

    res.json(visits);
});

router.post(`/${VISIT_FLOWS_BASE_TABLE_NAME}/search`, async (req, res) => {
    const service = new PapiService(VISIT_FLOWS_BASE_TABLE_NAME);
    const visits = await service.searchResources(req.body);

    res.json(visits);
});

router.get(`/${VISIT_FLOW_GROUPS_BASE_TABLE_NAME}`, async (req, res) => {
    const service = new PapiService(VISIT_FLOW_GROUPS_BASE_TABLE_NAME);
    const utilsService = new UtilsService(req);
    const findOptions = utilsService.buildFinOptionsQuery();
    const visits = await service.getResources(findOptions);

    res.json(visits);
});

router.get(`/${VISIT_FLOW_GROUPS_BASE_TABLE_NAME}/key/:key`, async (req, res) => {
    const service = new PapiService(VISIT_FLOW_GROUPS_BASE_TABLE_NAME);
    const visits = await service.getResourceByKey(req.params.key);

    res.json(visits);
});

router.post(`/${VISIT_FLOW_GROUPS_BASE_TABLE_NAME}/search`, async (req, res) => {
    const service = new PapiService(VISIT_FLOW_GROUPS_BASE_TABLE_NAME);
    const visits = await service.searchResources(req.body);

    res.json(visits);
});