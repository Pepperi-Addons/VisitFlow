import { Client, Request } from '@pepperi-addons/debug-server'
import { FlowService } from './services/flow.service';

// TODO: Add Journey code when needed.
// export async function get_filter_by_event(client: Client, request: Request): Promise<any> {

//     if (request.method === 'GET') {
//         const service = new FlowService(client);
//         const visitFlowOptionalValues: {Key: string, Value: any}[] = await service.getVisitFlowOptionalValues(request.query);

//         const fields: any[] = [{
//             FieldID: "Visit.Key",
//             FieldType: "String",
//             Title: "Visit key",
//             OptionalValues: visitFlowOptionalValues,
//         }, {
//             FieldID: "SelectedStep.GroupIndex",
//             FieldType: "Number",
//             Title: "Group index",
//         }, {
//             FieldID: "SelectedStep.StepIndex",
//             FieldType: "Number",
//             Title: "Step index",
//         }];

//         return {
//             Fields: fields
//         };

//     } else {
//         throw new Error('Method not supported')
//     }
// }