import { NgModule, ɵpublishDefaultGlobalUtils } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepIconRegistry, pepIconSystemAlert, pepIconSystemOk, pepIconSystemEdit, pepIconSystemFlag, pepIconSystemLock } from '@pepperi-addons/ngx-lib/icon';
import { GroupStatusIcon } from '../visit-details/pipes/group-status-icon.pipe';
import { ActivityStatusIcon } from '../visit-details/pipes/activity-status-icon.pipe';

import { VisitFlowComponent } from './index';
import { VisitDetailsComponent } from '../visit-details/visit-details.component';

import { config } from '../app.config';

export const routes: Routes = [
    {
        path: '',
        component: VisitFlowComponent
    }
];
//pepIconSystemOk
const pepIcons = [
    pepIconSystemAlert,
    pepIconSystemOk,
    pepIconSystemEdit,    
    pepIconSystemFlag,
    pepIconSystemLock
];

@NgModule({
    declarations: [
        VisitFlowComponent,
        VisitDetailsComponent,
        GroupStatusIcon,
        ActivityStatusIcon
    ],
    imports: [
        CommonModule,
        PepButtonModule,
        //PepTextboxModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) =>
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        }),
        RouterModule.forChild(routes)
    ],
    exports: [VisitFlowComponent],
    providers: [
        TranslateStore,
        // Add here all used services.
    ]
})
export class VisitFlowModule {
    constructor(
        translate: TranslateService,
        private pepIconRegistry: PepIconRegistry,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}