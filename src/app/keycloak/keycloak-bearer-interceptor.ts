/**
 * This interceptor includes the bearer by default in all HttpClient requests.
 *
 * If you need to exclude some URLs from adding the bearer, please, take a look
 * at the {@link KeycloakOptions} bearerExcludedUrls property.
 */
import {Injectable} from '@angular/core';
import {KeycloakService} from './keycloak.service';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {mergeMap} from 'rxjs/operators';

@Injectable()
export class KeycloakBearerInterceptor implements HttpInterceptor {
  constructor(private keycloakService: KeycloakService) {
  }

  /**
   * Intercept implementation that checks if the request url matches the excludedUrls.
   * If not, adds the Authorization header to the request.
   *
   * @param req
   * @param next
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const enableBearerInterceptor = this.keycloakService.enableBearerInterceptor;
    if (!enableBearerInterceptor) {
      return next.handle(req);
    }
    return this.keycloakService.addTokenToHeader(req.headers).pipe(
      mergeMap(headersWithBearer => {
        const kcReq = req.clone({ headers: headersWithBearer });
        return next.handle(kcReq);
      })
    );
  }
}
