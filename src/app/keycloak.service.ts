import { Injectable } from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable, Observer} from 'rxjs';

declare var Keycloak: any;

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  private keycloakAuth: any;
  /**
   * User profile as KeycloakProfile interface.
   */
  private _userProfile: Keycloak.KeycloakProfile;
  /**
   * When the implicit flow is choosen there must exist a silentRefresh, as there is
   * no refresh token.
   */
  private _silentRefresh: boolean;
  /**
   * The bearer prefix that will be appended to the Authorization Header.
   */
  private _bearerPrefix: string;
  /**
   * Value that will be used as the Authorization Http Header name.
   */
  private _authorizationHeaderName: string;

  init(): Promise<any> {
    this._silentRefresh = false;
    this._authorizationHeaderName = 'Authorization';
    this._bearerPrefix = 'bearer';
    return new Promise((resolve, reject) => {
      const config = {
        'url': 'http://localhost:8080/auth',
        'realm': 'spring-security-example',
        'clientId': 'angular_keycloak_app'
      };
      this.keycloakAuth = new Keycloak(config);
      this.keycloakAuth.init({ onLoad: 'login-required' })
        .success(async authenticated => {
          if (authenticated) {
            await this.loadUserProfile();
          }
          resolve(authenticated);
        })
        .error(() => {
          reject();
        });
    });
  }
  /**
   * Loads the user profile.
   * Returns promise to set functions to be invoked if the profile was loaded
   * successfully, or if the profile could not be loaded.
   *
   * @param forceReload
   * If true will force the loadUserProfile even if its already loaded.
   * @returns
   * A promise with the KeycloakProfile data loaded.
   */
  loadUserProfile(
    forceReload: boolean = false
  ): Promise<Keycloak.KeycloakProfile> {
    return new Promise(async (resolve, reject) => {
      if (this._userProfile && !forceReload) {
        resolve(this._userProfile);
        return;
      }

      if (!this.keycloakAuth.authenticated) {
        reject('The user profile was not loaded as the user is not logged in.');
        return;
      }

      this.keycloakAuth
        .loadUserProfile()
        .success(result => {
          this._userProfile = result as Keycloak.KeycloakProfile;
          resolve(this._userProfile);
        })
        .error(() => reject('The user profile could not be loaded.'));
    });
  }
  /**
   * Redirects to login form on (options is an optional object with redirectUri and/or
   * prompt fields).
   *
   * @param options
   * Object, where:
   *  - redirectUri: Specifies the uri to redirect to after login.
   *  - prompt:By default the login screen is displayed if the user is not logged-in to Keycloak.
   * To only authenticate to the application if the user is already logged-in and not display the
   * login page if the user is not logged-in, set this option to none. To always require
   * re-authentication and ignore SSO, set this option to login .
   *  - maxAge: Used just if user is already authenticated. Specifies maximum time since the
   * authentication of user happened. If user is already authenticated for longer time than
   * maxAge, the SSO is ignored and he will need to re-authenticate again.
   *  - loginHint: Used to pre-fill the username/email field on the login form.
   *  - action: If value is 'register' then user is redirected to registration page, otherwise to
   * login page.
   *  - locale: Specifies the desired locale for the UI.
   * @returns
   * A void Promise if the login is successful and after the user profile loading.
   */
  login(options: Keycloak.KeycloakLoginOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this.keycloakAuth
        .login(options)
        .success(async () => {
          await this.loadUserProfile();
          resolve();
        })
        .error(() => reject(`An error happened during the login.`));
    });
  }

  /**
   * Redirects to logout.
   *
   * @param redirectUri
   * Specifies the uri to redirect to after logout.
   * @returns
   * A void Promise if the logout was successful, cleaning also the userProfile.
   */
  logout(redirectUri?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const options: any = {
        redirectUri
      };

      this.keycloakAuth
        .logout(options)
        .success(() => {
          this._userProfile = undefined;
          resolve();
        })
        .error(() => reject('An error happened during logout.'));
    });
  }
  /**
   * Returns the authenticated token, calling updateToken to get a refreshed one if
   * necessary. If the session is expired this method calls the login method for a new login.
   *
   * @returns
   * Promise with the generated token.
   */
  getToken(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.updateToken(10);
        resolve(this.keycloakAuth.token);
      } catch (error) {
        this.login();
      }
    });
  }

  /**
   * Check if user is logged in.
   *
   * @returns
   * A boolean that indicates if the user is logged in.
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      if (!this.keycloakAuth.authenticated) {
        return false;
      }
      await this.updateToken(20);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns true if the token has less than minValidity seconds left before
   * it expires.
   *
   * @param minValidity
   * Seconds left. (minValidity) is optional. Default value is 0.
   * @returns
   * Boolean indicating if the token is expired.
   */
  isTokenExpired(minValidity: number = 0): boolean {
    return this.keycloakAuth.isTokenExpired(minValidity);
  }

  /**
   * If the token expires within minValidity seconds the token is refreshed. If the
   * session status iframe is enabled, the session status is also checked.
   * Returns a promise telling if the token was refreshed or not. If the session is not active
   * anymore, the promise is rejected.
   *
   * @param minValidity
   * Seconds left. (minValidity is optional, if not specified 5 is used)
   * @returns
   * Promise with a boolean indicating if the token was succesfully updated.
   */
  updateToken(minValidity: number = 5): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      // TODO: this is a workaround until the silent refresh (issue #43)
      // is not implemented, avoiding the redirect loop.
      if (this._silentRefresh) {
        if (this.isTokenExpired()) {
          reject('Failed to refresh the token, or the session is expired');
        } else {
          resolve(true);
        }
        return;
      }

      if (!this.keycloakAuth) {
        reject('Keycloak Angular library is not initialized.');
        return;
      }

      this.keycloakAuth
        .updateToken(minValidity)
        .success(refreshed => {
          resolve(refreshed);
        })
        .error(() =>
          reject('Failed to refresh the token, or the session is expired')
        );
    });
  }

  /**
   * Returns the logged username.
   *
   * @returns
   * The logged username.
   */
  getUsername(): string {
    if (!this._userProfile) {
      throw new Error('User not logged in or user profile was not loaded.');
    }

    return this._userProfile.username;
  }

  /**
   * Clear authentication state, including tokens. This can be useful if application
   * has detected the session was expired, for example if updating token fails.
   * Invoking this results in onAuthLogout callback listener being invoked.
   */
  clearToken(): void {
    this.keycloakAuth.clearToken();
  }

  /**
   * Adds a valid token in header. The key & value format is:
   * Authorization Bearer <token>.
   * If the headers param is undefined it will create the Angular headers object.
   *
   * @param headers
   * Updated header with Authorization and Keycloak token.
   * @returns
   * An observable with with the HTTP Authorization header and the current token.
   */
  addTokenToHeader(
    headers: HttpHeaders = new HttpHeaders()
  ): Observable<HttpHeaders> {
    return Observable.create(async (observer: Observer<any>) => {
      try {
        const token: string = await this.getToken();
        headers = headers.set(
          this._authorizationHeaderName,
          this._bearerPrefix + token
        );
        observer.next(headers);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Returns the original Keycloak instance, if you need any customization that
   * this Angular service does not support yet. Use with caution.
   *
   * @returns
   * The KeycloakInstance from keycloak-js.
   */
  getKeycloakInstance(): Keycloak.KeycloakInstance {
    return this.keycloakAuth;
  }
}
