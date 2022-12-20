import { AddonDataScheme, ApiFieldObject, Relation } from "@pepperi-addons/papi-sdk"

export const ActivityType = {
    ExternalID: 'VF_VisitFlowMainActivity',
    Icon: 'icon2',
    Description: 'The Main Activity for the visit flow'
}

export const VisitFlowTSAFields: ApiFieldObject[] = [
    {
        FieldID: "TSAStartVisitDateTime",
        Label: "StartVisitDateTime",
        Description: "Start Visit Date Time",
        IsUserDefinedField: true,
        UIType: {
            ID: 6,
            Name: "DateAndTime"
        },
        Type: "String",
        Format: "DateTime"
    },
    {
        FieldID: "TSAEndVisitDateTime",
        Label: "EndVisitDateTime",
        Description: "End Visit Date Time",
        IsUserDefinedField: true,
        UIType: {
            ID: 6,
            Name: "DateAndTime"
        },
        Type: "String",
        Format: "DateTime"
    },
    {
        FieldID: "TSAFlowID",
        Label: "FlowId",
        Description: "Flow ID",
        IsUserDefinedField: true,
        UIType: {
            ID: 1,
            Name: "TextBox"
        },
        Type: "String",
        Format: "String"
    }
]

