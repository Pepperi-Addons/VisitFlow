import '@pepperi-addons/cpi-node';
import VisitFlowService from './visit-flow-cpi.service';

export async function load(configuration: any) {
    pepperi.events.intercept('OnClientFlowsLoad' as any, {}, async (data): Promise<void> => {
        
        debugger;
        data.collection = 'VisitFlows';
        const service = new VisitFlowService(data.collection);
        return await service.getFlows() as any;
        //TODO                        
        //1 - get all active flows   
        //2 - get active flow - for that you need only the startEndFlow activity
        //3 - if found active - load it. else - show flows list (if only one found - load it)
        //const flows = await pepperi.resources.resource("VisitFlows").get({where: 'Active = true'});
        // const flows = await pepperi.resources.resource("VisitFlows").get({ where: `Key = ${data.flowUUID}` });

        // const flows = await pepperi.resources.resource(data.collection).get({});
        /*
        const activities = await pepperi.api.activities.search({
            fields: ['UUID', 'Type', 'ActivityTypeID', 'StatusName', 'CreationDateTime', 'TSAFlowId', 'TSAStartVisitDateTime', 'TSAEndVisitDateTime'],
            filter: {
                ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: []
            }            
        });
        console.log(`recieved activities: ${JSON.stringify(activities)}`);*/
        /*return flows
            .filter(flow => flow.Active === true)
            .map(flow => {
                return {
                    key: flow.Key,
                    name: flow.Name
                }
            }) as any;*/
            //.get({ where: 'Active = true' });

        //return flows.map(flow => flow.Name) as any;
    });

    pepperi.events.intercept('OnClientVisitLoad' as any, {}, async (data): Promise<void> => {
        const service = new VisitFlowService('');
        const flow = await pepperi.resources.resource(data.collection).get({ where: `Key = ${data.flowUUID}` });
        //1 - fetch the activities
        //2 - fetch the activities scheme
        //3 - from the scheme get the group collection name
        //4 - get the group collection


        const groups = service.getGroups();
        return groups as any;
    });

    pepperi.events.intercept('OnClientVisitActivityClick' as any, {}, async (data): Promise<void> => {
        const url = data.url;
        await data.client?.navigateTo({ url: url });

    });

}

export const router = Router()
router.get('/test', (req, res) => {
    res.json({
        hello: 'World'
    })
})