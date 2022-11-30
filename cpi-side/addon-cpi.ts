import '@pepperi-addons/cpi-node';
import VisitFlowService from './visit-flow-cpi.service';

export async function load(configuration: any) {
    pepperi.events.intercept('OnVisitLoad' as any, {}, async (data): Promise<void> => {
        const service = new VisitFlowService();
        const groups = service.getGroups();
       
        //await data.client?.alert('cpi activitires', Object.entries(activities).length.toString());

        return groups as any;
    });

    pepperi.events.intercept('OnVisitActivityClick' as any, {}, async (data): Promise<void> => {
        const url = data.url;        
        await data.client?.navigateTo({url: url});
        
    });
   
}

export const router = Router()
router.get('/test', (req, res) => {
    res.json({
        hello: 'World'
    })
})