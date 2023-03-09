import { User } from '@pepperi-addons/cpi-node';

export interface Step {
    Title: string;
    Resource: string;
    ResourceCreationData: string;
    BaseActivities: string[];
    Mandatory: boolean;
    Disabled: boolean;
    Completed: boolean;
    CompletedStatusName: string[];
    MaxCount: number;
    salesChannelSelector: string[];
    profileSelection: string[];
    additionalVisitData: string;
    catalogToUse: string;
}

export interface Group {
    Title: string;
    Steps: Step[];
}

export interface Visit {
    Key: string;
    Title: string;
    Groups: Group[];
    Active: boolean;
    divisionSelector: string;
}

export interface SelectedStep {
    GroupIndex: number;
    StepIndex: number;
}

export interface RootObject {
    AccountUUID: string;
    Visits: Visit[];
}

export interface ClickObject {
    AccountUUID: string;
    Visit: Visit;
    SelectedStep: SelectedStep;
}

export const DEBUG_ENABLED = true;
export const VISIT_FLOW_MAIN_ACTIVITY = 'VF_VisitFlowMainActivity';

export async function onVisitLoadScript(data: any) {

    //await client.alert("Yo", 'OnVisitFlowLoad');
    //await debug(JSON.stringify(data));

    let visits: any[] = [];
    let accountUUID = '';

    // debug(data.data);
    //await debug(data.data.AccountUUID);

    if (
        data?.data &&
        data.data.AccountUUID &&
        data.data.Visits?.length
    ) {
        accountUUID = data.data.AccountUUID;
        visits = data.data.Visits;

        const hasOpenVisitInAnotherAccount = await hasOpenVisitOnAnotherAccount(accountUUID);

        if (!hasOpenVisitInAnotherAccount) {
            // await client.alert("we dont have a visit on another account", "yay");
            let userProfile = 'PSR'; // TODO - assign this from the user
            let salesChannel = 'MT'; // TODO - assign this from the account

            const account = await pepperi.api.accounts.get(
                {
                    fields: ['TSASalesChannel'],
                    key: { UUID: accountUUID }
                }
            )

            if (account) {
                salesChannel = account.object.TSASalesChannel;
            }
            if (!salesChannel) {
                salesChannel = 'MT';
            }

            let userInfo: any = undefined;

            try {
                // await client.alert('main', 'before filterVisits');
                //@ts-ignore
                const user: User = await pepperi.environment.user();
                const userUUID = user.uuid;// await getUserUUID(accountUUID);
                userInfo = await pepperi.resources.resource('UserInfo').key(userUUID).get();

            } catch (error: any) {
                debug(error.message);
                // throw new Error(error.message);
            }

            if (!userInfo) {
                userInfo = { division: "F3", profile: "Pepperi PSR" };
            }

            if (userInfo) {
                const division = userInfo.division;
                const profile = userInfo.profile; // TODO
                filterVisits(visits, division);

                //await client.alert('main', 'before filterHidden');
                filterProfileAndSalesChannel(visits, profile, salesChannel);

                await duplicateSteps(visits, profile);

                //await client.alert('main', 'before filterByFrequency');
                //filterByFrequency(visits, accountUUID);

                await filterBaseActivities(visits);
                await markDisabled(visits);
            }
            else {
                // in case we dont have a user info
                // return empty visits
                visits = [];
            }
        }
        else {
            // await client.alert("visits length", JSON.stringify(visits?.length));
            visits = [];
            // await client.alert("Should throw exception now", "did it?");
            // throw new Error("There is an open visit on another account");
        }
    }
    // }
    // else {
    //     throw new Error("There is an open visit");
    // }

    // await client.alert("visits length before return", JSON.stringify(visits?.length));
    return {
        Visits: visits
    };

    async function hasOpenVisitOnAnotherAccount(accountUUID: string) {
        const accountStr = accountUUID.replace(/-/g, '');
        const res = await pepperi.api.activities.search({
            fields: ['UUID', 'Type', 'StatusName', 'CreationDateTime', 'TSAFlowID', 'AccountName'],
            filter: {
                Operation: 'AND',
                LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'Today', Values: [] },
                RightNode: {
                    Operation: 'AND',
                    LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'IsNotEqual', Values: [accountStr] }
                    , RightNode: {
                        Operation: 'AND',
                        LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'IsNotEmpty', Values: [] }
                        , RightNode:
                            { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [VISIT_FLOW_MAIN_ACTIVITY] }
                    }
                }
            },
            sorting: [{ Field: 'CreationDateTime', Ascending: false }],
            pageSize: 1
        });

        let hasOpenVisit = false;
        if (res.objects?.length) {
            hasOpenVisit = res.objects[0]["StatusName"] !== 'Submitted'
            //await client.alert("open visit", JSON.stringify(res.objects[0]));
        }

        return hasOpenVisit;
    }


    function filterVisits(visits: Visit[], division: string) {
        if (division) {
            //filter visits by division
            visits = visits.filter(visit => visit.divisionSelector === division);
        }
        visits = visits.filter(visit => visit.Active === false);
    }

    function filterProfileAndSalesChannel(visits: Visit[], profile: string, salesChannel: string) {
        // if a step doesn't have the value of sales channel on salesChannelSelector field remove the step
        // if a step doesn't have the value of profile on profileSelection field remove the step
        for (let visit of visits) {
            for (let group of visit.Groups) {

                for (let i = group.Steps.length - 1; i >= 0; --i) {
                    let step = group.Steps[i];
                    //await debug(JSON.stringify(step));
                    if (group.Steps[i]?.profileSelection?.length) {
                        const item = group.Steps[i].profileSelection.find(p => p === profile);
                        if (!item) {
                            group.Steps.splice(i, 1);
                        }
                    }
                    if (group.Steps[i]?.salesChannelSelector?.length) {
                        const item = group.Steps[i].salesChannelSelector.find(channel => channel === salesChannel);
                        if (!item) {
                            group.Steps.splice(i, 1);
                        }
                    }
                }
            }
        }
    }

    async function duplicateSteps(visits: Visit[], userProfile: string) {
        for (let visit of visits) {
            for (let group of visit.Groups) {
                let newSteps: Step[] = [];
                for (let i = 0; i < group.Steps.length; i++) {
                    let step = group.Steps[i];
                    if (step.Resource == 'transactions') {

                        // get the catalogs
                        const res = await pepperi.resources.resource("TransactionsCatalogsRelation").search({
                            Fields: ['catalogsExternalID'],
                            Where: `transactionName='${step.ResourceCreationData}'`
                        });

                        if (res?.Objects?.length) {
                            let transactionCatalogs = res.Objects[0];

                            // when there is only one catalog, add the stap as is
                            if (transactionCatalogs.catalogsExternalID.length == 1) {
                                step.catalogToUse = transactionCatalogs.catalogsExternalID[0];
                                newSteps.push(step);
                            }
                            else {
                                for (let catalog of transactionCatalogs.catalogsExternalID) {

                                    // Get the profiles from the catalog TSA
                                    const profilesRes = await pepperi.resources.resource("catalogs").search({
                                        Fields: ['TSAProfiles'],
                                        Where: `ExternalID='${catalog}'`
                                    });

                                    // duplicate the step only if there are profiles on the catalog
                                    // and the profiles include the current profile
                                    if (profilesRes?.Objects?.length) {
                                        let profiles = profilesRes.Objects[0].TSAProfiles;

                                        if (profiles?.includes(userProfile)) {
                                            let newStep = Object.assign({}, step);
                                            newStep.catalogToUse = catalog;
                                            newStep.Title = step.Title + ' - ' + newStep.catalogToUse;
                                            newSteps.push(newStep);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        newSteps.push(step);
                    }
                }
                if (newSteps.length) {
                    group.Steps = newSteps;
                }

            }
        }

    }

    /**
     * filter steps that were already created during the given period
     * currently supports types - days / weeks / months
     */
    async function filterByFrequency(visits: any[], accountUUID: string) {
        let promiseList: {
            iIndex: number,
            jIndex: number,
            hIndex: number,
            promise: any
        }[] = [];

        for (let i = 0; i < visits.length; i++) {
            for (let j = 0; j < visits[i].Groups.length; j++) {
                for (let h = 0; h < visits[i].Groups[j].Steps.length; h++) {
                    const step = visits[i].Groups[j].Steps[h];
                    //relevant only if no BaseActivity found and frequency params exist
                    if (
                        step?.BaseActivities?.length === 0 &&
                        step.frequencyType && step.frequencyType != 'None' && step.frequencyType != '' &&
                        step.frequencyValue && step.frequencyValue > 0
                    ) {
                        //await client.alert("Step", JSON.stringify(step));
                        const stepActivities: any = await getLastExecutedInstance(accountUUID, step);

                        if (stepActivities?.count >= step.frequencyValue) {
                            promiseList.push({
                                iIndex: i,
                                jIndex: j,
                                hIndex: h,
                                promise: ""
                            });
                        }
                    }
                }
            }
        }

        if (promiseList.length) {
            for (let i = 0; i < promiseList.length; i++) {
                    //if (promiseList[i]?.objects?.length > 0 || promiseList[i]?.Objects?.length > 0) {
                        //found similar resource in date range - remove item
                        visits[promiseList[i].iIndex].Groups[promiseList[i].jIndex].Steps.splice(promiseList[i].hIndex, 1);
                    //}
                }



            /*
            const promises = promiseList.map(item => item.promise);
            let res: any = [];
            try {
                res = await Promise.all(promises);
            }
            catch (error) {
                // error handle
            }
            if (res?.length === promises.length) {
                for (let i = 0; i < res.length; i++) {
                    if (res[i]?.objects?.length > 0 || res[i]?.Objects?.length > 0) {
                        //found similar resource in date range - remove item
                        visits[promiseList[i].iIndex].Groups[promiseList[i].jIndex].Steps.splice(promiseList[i].hIndex, 1);
                    }
                }
            }
            */
        }
    }

    /**
     * retrive a promise of the last instance
     */
    async function getLastExecutedInstance(accountUUID: string, step: any) {

        const resource = step.Resource;
        const resourceCreationData = step.ResourceCreationData;
        const frequencyType = step.frequencyType;
        const frequencyValue = step.frequencyValue.toString();

        let item: any | null = null;
        let res: any;
        //@ts-ignore
        const user: User = await pepperi.environment.user();
        const accountUUIDStr = accountUUID.replace(/-/g, '');
        const filterObj: any = {
            Operation: 'AND',
            LeftNode: {
                Operation: 'AND',
                LeftNode: { ApiName: 'CreationDateTime', FieldType: 'DateTime', Operation: 'ThisMonth', Values: [] }
                , RightNode: { ApiName: 'Creator.UUID', FieldType: 'String', Operation: 'IsEqual', Values: [user.uuid] }
            },
            RightNode: {
                Operation: 'AND',
                LeftNode: { ApiName: 'AccountUUID', FieldType: 'String', Operation: 'Contains', Values: [accountUUIDStr] }
                , RightNode: { ApiName: 'Type', FieldType: 'String', Operation: 'Contains', Values: [resourceCreationData] }
            }
        };

        const sorting = [{ Field: 'CreationDateTime', Ascending: false }];
        const fields = ['UUID', 'CreationDateTime', 'StatusName', 'TSAVisitData', 'CatalogExternalID'];
        switch (resource) {
            case 'activities':
                res = await pepperi.api.activities.search({
                    fields: fields,
                    filter: filterObj,
                    sorting: sorting,
                    pageSize: -1
                });

                if (res?.success && res.objects?.length) {
                    res.objects = res.objects.filter(act => step.CompletedStatusName.includes(act.StatusName));
                    // update the count property after filtering
                    res.count = res.objects.length || 0;
                }
                break;
            case 'transactions':
                res = await pepperi.api.transactions.search({
                    fields: fields,
                    filter: filterObj,
                    sorting: sorting,
                    pageSize: -1
                });

                if (res?.success && res.objects?.length) {
                    // filter the array by: Catalog, Completed && additional data
                    res.objects = res.objects.filter(act => act.CatalogExternalID === step.catalogToUse &&
                        act.TSAVisitData === step.additionalVisitData &&
                        step.CompletedStatusName.includes(act.StatusName));
                    // update the count property after filtering
                    res.count = res.objects.length || 0;
                }
                break;
            default:
                debugger;
                res = await pepperi.resources.resource(resource).search({
                    Fields: ['Key', 'StatusName', 'CreationDateTime', 'Account'],
                    Where: `Template='${resourceCreationData}' And Creator = '${user.uuid}' And Account='${accountUUIDStr}' And CreationDateTime >= '${getStartTime(frequencyType, frequencyValue)}'`

                });
                break;
        }
        return res;
    }

    async function getStartTime(frequencyType, frequencyValue) {
        let dt = new Date();

        switch (frequencyType) {
            case 'Month':
                dt.setMonth(dt.getMonth() - frequencyValue);
                break;
            case 'Week':
                dt.setDate(dt.getDate() - (frequencyValue * 7));
                break;
            case 'Day':
                dt.setDate(dt.getDate() - frequencyValue);
                break;
        }

        let dateStr = dt.toISOString();
        return dateStr;
    }

    /*
    This function should filter the base activities for steps that are transactions.
    if the transaction catalog && initialize Data is equal to the values on the step, 
    it should remain in the base activities, otherwise remove it.
     
    */
    async function filterBaseActivities(visits: Visit[]) {
        for (const visit of visits) {
            let inProgress = visit.Groups[0]?.Steps[0]?.Completed;
            if (inProgress) {
                for (const group of visit.Groups) {
                    for (const step of group.Steps) {
                        switch (step.Resource) {
                            case 'activities': {
                                {
                                    const activityObjects = await Promise.all(step.BaseActivities.map(async activityUUID => {
                                        let activityObj: {
                                            UUID: string;
                                            StatusName: string;
                                            TSAVisitData?: string
                                        } | undefined;
                                        if (activityUUID) {
                                            let fields: string[] = [
                                                'StatusName'
                                            ];
                                            activityObj = {
                                                UUID: activityUUID,
                                                ...(await getActivity(activityUUID, fields)).object
                                            } as any;
                                        }
                                        return activityObj;
                                    }))

                                    step.Completed = activityObjects.find(obj => step.CompletedStatusName.some(e => e === obj?.StatusName)) != undefined;
                                    step.Disabled = step.MaxCount ? activityObjects.length >= step.MaxCount : (step.ResourceCreationData === VISIT_FLOW_MAIN_ACTIVITY && step.Completed);
                                }
                                break;
                            }
                            case 'transactions': {
                                {
                                    const transactionObjects = await Promise.all(step.BaseActivities.map(async transactionUUID => {
                                        let transactionObj: {
                                            UUID: string;
                                            CatalogExternalID: string;
                                            StatusName: string;
                                            TSAVisitData?: string
                                        } | undefined;
                                        if (transactionUUID) {
                                            let fields: string[] = [
                                                'CatalogExternalID',
                                                'StatusName'
                                            ];
                                            // if (step.ResourceCreationData === 'AvailabilityCheck') {
                                            if (step.ResourceCreationData === 'Ori AVCheck') {
                                                fields.push('TSAVisitData');
                                            }
                                            transactionObj = {
                                                UUID: transactionUUID,
                                                ...(await getTransaction(transactionUUID, fields)).object
                                            } as any;
                                        }
                                        //await client.alert("****** transactionObj ******", JSON.stringify(transactionObj));
                                        return transactionObj;
                                    }))

                                    const stepTransactions = transactionObjects.filter(transactionObj => {
                                        let res = false;
                                        if (transactionObj) {
                                            const catalogExID = transactionObj.CatalogExternalID;
                                            const tsaVisitData = !!transactionObj.TSAVisitData ? transactionObj.TSAVisitData : '';
                                            const stepVisitData = !!step.additionalVisitData ? step.additionalVisitData : '';
                                            if (catalogExID == step.catalogToUse &&
                                                tsaVisitData == stepVisitData) {
                                                res = true;
                                            }
                                        }
                                        return res;
                                    });

                                    step.BaseActivities = stepTransactions.map(obj => obj!.UUID);
                                    //await client.alert("****** BaseActivities ******", JSON.stringify(step.BaseActivities));
                                    step.Completed = stepTransactions.find(obj => step.CompletedStatusName.some(e => e === obj?.StatusName)) != undefined;
                                    step.Disabled = step.MaxCount ? stepTransactions.length >= step.MaxCount : false;
                                }
                                break;
                            }
                            default: {
                                {
                                    const surveyObjects = await Promise.all(step.BaseActivities.map(async surveyUUID => {
                                        let surveyObj: {
                                            UUID: string;
                                            StatusName: string;
                                            TSAVisitData?: string
                                        } | undefined;
                                        if (surveyUUID) {
                                            surveyObj = {
                                                UUID: surveyUUID,
                                                ...(await getSurvey(step.Resource, surveyUUID)).Objects[0]
                                            } as any;
                                        }
                                        return surveyObj;
                                    }))

                                    step.Completed = surveyObjects.find(obj => step.CompletedStatusName.some(e => e === obj?.StatusName)) != undefined;
                                    step.Disabled = step.MaxCount ? surveyObjects.length >= step.MaxCount : false;
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
    }


    // This will make all the activities after a mandatory activity as disabled
    // includes the End activity step
    async function markDisabled(visits: Visit[]) {
        for (let visit of visits) {
            let inProgress = visit.Groups[0]?.Steps[0]?.BaseActivities?.length > 0;
            if (inProgress) {
                let foundMandatory = false;
                for (let group of visit.Groups) {
                    for (let step of group.Steps) {

                        if (foundMandatory) {
                            step.Disabled = true;
                        }
                        else if (!step.Completed && step.Mandatory) {
                            foundMandatory = true;
                        }
                    }
                }
            }
        }
    }

    async function getTransaction(key: string, fields: string[]) {
        await debug('getTransactionֿ' + JSON.stringify(fields));
        return await pepperi.api.transactions.get(
            {
                fields: fields,
                key: { UUID: key }
            }
        )
    }

    async function getActivity(key: string, fields: string[]) {
        await debug('getActivity' + JSON.stringify(fields));
        return await pepperi.api.activities.get(
            {
                fields: fields,
                key: { UUID: key }
            }
        )
    }

    async function getUserUUID(accountUUID) {
        let userUUID = '';
        let resource = await pepperi.app.activities.add({
            type: {
                Name: 'Test Activity'
            },
            references: {
                account: {
                    UUID: accountUUID
                }
            }
        });

        if (resource.status === 'added') {
            const fields = ['CreatorUUID'];
            userUUID = await (await getActivity(resource.id, fields)).object.CreatorUUID;
            // await pepperi.app.activities.update([{ UUID: resource.id, Hidden: true }],
        }
        return userUUID;
    }

    async function getSurvey(resource: string, key: string) {
        // return await pepperi.resources.resource(resource).key(key).get() as any;

        const res = await pepperi.resources.resource(resource).search({
            Fields: ['Key', 'StatusName'],
            Where: `Key='${key}'`
        });
        return res as any;

    }

}

async function debug(message: string) {
    // if (DEBUG_ENABLED) {
    //await client.alert("debug", message);
    console.log(message);
    // }
}

export async function main(data) {
    return await onVisitLoadScript(data);
}