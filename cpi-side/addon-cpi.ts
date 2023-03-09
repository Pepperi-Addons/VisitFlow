import '@pepperi-addons/cpi-node';
import { Request } from '@pepperi-addons/debug-server'
import VisitFlowService from './visit-flow-cpi.service';
import { PapiService } from './papi.service';
import {
    CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_LOAD,
    USER_ACTION_ON_VISIT_FLOW_LOAD,
    CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_STEP_CLICK,
    USER_ACTION_ON_VISIT_FLOW_STEP_CLICK,
    CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_GROUP_CLICK,
    USER_ACTION_ON_VISIT_FLOW_GROUP_CLICK,
    VISIT_FLOW_MAIN_ACTIVITY,
    VISIT_FLOWS_BASE_TABLE_NAME,
    VISIT_FLOW_STEPS_TABLE_NAME,
    VISIT_FLOW_GROUPS_BASE_TABLE_NAME,
    VISIT_FLOWS_TABLE_NAME
} from 'shared';
import { UtilsService } from './utils.service';
//import { onVisitLoadScript } from './ori-scripts';

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

                // const eventRes: any = await onVisitLoadScript({
                //     data: {           
                //         AccountUUID: data.AccountUUID,             
                //         Visits: visits                        
                //     },
                //     ObjectType: data.ResourceName                    
                // });

                // if (eventRes?.Visits) {
                //     visits = eventRes.Visits;
                // }

                if (visits?.length) {
                    
                    if(visits.length === 1){ // && visits[0].Groups[0].Steps[0].Completed
                        try{
                            const _visitFlowService = new VisitFlowService(data.AccountUUID);
                            // check if have in-progress visit
                            const inProgressVisit = await _visitFlowService.getInProgressVisitFlow('VisitFlows');
                            const res: any = await _visitFlowService.getStartEndActivitiesPromise();
                            if(inProgressVisit){
                                if(res?.objects && res.objects?.length > 0){
                                    const activity = await pepperi.DataObject.Get('activities',res.objects[0].UUID);
                                    const selectedGroup = await activity?.getFieldValue('TSAVisitSelectedGroup');
                                    // check if this tsa exits and have a value
                                    if(selectedGroup){
                                        //check if visit groups contain the selected group
                                        //could be remove by user event
                                        //if not found return undefined
                                        visits[0]['SelectedGroup'] = visits[0].Groups.filter(group => group.Key == selectedGroup).length === 1 ? selectedGroup : undefined;
                                    }
                                }
                            }
                        }
                        catch(err: any){
                            await data.client?.alert('Error on get selected group:', err.message);
                        }
                    }
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
        if(data?.SelectedGroup){
            try{
                const _visitFlowService = new VisitFlowService(data.AccountUUID);
                const res: any = await _visitFlowService.getStartEndActivitiesPromise();
    
                if(res?.objects && res.objects.length > 0){
                    const activity = await pepperi.DataObject.Get('activities',res.objects[0].UUID);
                    await activity?.setFieldValue('TSAVisitSelectedGroup',data.SelectedGroup.Key);
                }
            }
            catch(err: any){
                await data.client?.alert('Error on set selected group:', err.message);
            }
        }
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
                url = await service.getStepUrl(data.client as any, step, inputData.Visit?.Key);
            }

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

    pepperi.events.intercept(CLIENT_ACTION_ON_CLIENT_VISIT_FLOW_GROUP_CLICK as any, {}, async (data): Promise<any> => {
        try {
            let inputData = {
                AccountUUID: data.AccountUUID,
                Visit: data.Visit,
                SelectedGroup: data.SelectedGroup
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
            // Emit user event OnVisitFlowGroupClick
            const eventRes: any = await pepperi.events.emit(USER_ACTION_ON_VISIT_FLOW_GROUP_CLICK, {
                Data: inputData,
                ObjectType: visit.ResourceName
            }, data);

            if (eventRes?.data?.Data) {
                inputData = eventRes.data.Data;
            }

            
            return {};
            
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