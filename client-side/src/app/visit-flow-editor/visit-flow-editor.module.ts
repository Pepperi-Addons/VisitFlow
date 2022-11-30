import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';

import { VisitFlowEditorComponent } from './index';

import { config } from '../app.config';

@NgModule({
    declarations: [VisitFlowEditorComponent],
    imports: [
        CommonModule,
        TranslateModule.forChild(),
        PepSelectModule
    ],
    exports: [VisitFlowEditorComponent],
    providers: [
        TranslateStore,
        // Add here all used services.
    ]
})
export class VisitFlowEditorModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
