import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule} from '@angular/core';
import { KeycloakService } from './keycloak/keycloak.service';
export function kcFactory(keycloakService: KeycloakService) {
  return () => keycloakService.init();
}
import { AppComponent } from './app.component';
import { HelloComponent } from './hello/hello.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {KeycloakBearerInterceptor} from './keycloak/keycloak-bearer-interceptor';

@NgModule({
  declarations: [
    AppComponent,
    HelloComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
  ],
  providers: [
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: kcFactory,
      deps: [KeycloakService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBearerInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
