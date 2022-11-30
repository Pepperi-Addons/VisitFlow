import { DoBootstrap, Injector, NgModule, Type } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { PepAddonService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routes';

//import { SettingsComponent, SettingsModule } from './settings';

import { VisitFlowModule, VisitFlowComponent } from './visit-flow';
import { VisitFlowEditorModule, VisitFlowEditorComponent } from './visit-flow-editor';

import { config } from './app.config';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        VisitFlowModule,
        VisitFlowEditorModule,
        //SettingsModule,
        PepNgxLibModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }
        }),
        AppRoutingModule,
    ],
    providers: [],
    bootstrap: [
        // AppComponent
    ]
})
export class AppModule implements DoBootstrap {
    constructor(
        private injector: Injector,
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }

    ngDoBootstrap() {
        //this.pepAddonService.defineCustomElement(`settings-element-${config.AddonUUID}`, AppComponent, this.injector);
        this.pepAddonService.defineCustomElement(`block-element-${config.AddonUUID}`, VisitFlowComponent, this.injector);
        this.pepAddonService.defineCustomElement(`block-editor-element-${config.AddonUUID}`, VisitFlowEditorComponent, this.injector);
    }
}

