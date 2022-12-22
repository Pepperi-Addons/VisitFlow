import '@pepperi-addons/cpi-node';
import VisitFlowService from './visit-flow-cpi.service';

export async function load(configuration: any) {
    pepperi.events.intercept('OnClientVisitsLoad' as any, {}, async (data, next, main): Promise<any> => {
        // debugger;   
        //data.collection = 'VisitFlows';
        debugger;
        const service = new VisitFlowService(data.AccountUUID);
        let visits: any[] = [];
        //1 - check if there is an active flow
        const inProgressVisit = await service.getInProgressVisitFlow(data.Collection);
        debugger;
        // user event - onVisitActiveDataLoad
        if (inProgressVisit) {
            //load in-progress visit            
            visits = await service.createVisitFlows(inProgressVisit, true);
            // user event - onVisitViewLoad
        } else {
            //load active visits
            visits = await service.createVisitFlows();
            // user eevet - onVisitFlowsDataLoad
        }

        debugger;
        return { visits: visits };
    });

    pepperi.events.intercept('OnClientStartVisitClick' as any, {}, async (data): Promise<void> => {
        const service = new VisitFlowService(data.AccountUUID);
        debugger;
        const url = await service.getStartVisitUrl(data.VisitUUID);

        debugger;

        //return { url: url };

        if (url) {
            await data.client?.navigateTo({ url: url });
        }
    });

    pepperi.events.intercept('OnClientVisitActivityClick' as any, {}, async (data): Promise<void> => {
        const service = new VisitFlowService(data.AccountUUID);
        //if Type = transaction
        //const catalogUUID =  await service.chooseCatalog(data.client as any);
        debugger;
        const url = await service.getActivityUrl(data.client as any, data.ResourceType, data.ResourceTypeID, data.CreationDateTime);
        debugger;

        //return { url: url };        
        if (url) {
            await data.client?.navigateTo({ url: url });
        } 

    });

}

export const router = Router()
router.get('/test', (req, res) => {
    res.json({
        hello: 'World'
    })
})