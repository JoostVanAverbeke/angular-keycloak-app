import { HelloService } from './hello.service';
import { of } from 'rxjs';

describe('HelloService', () => {
  let httpClientSpy: { get: jasmine.Spy };
  let helloService: HelloService;
  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
    helloService = new HelloService(<any> httpClientSpy);
  });

  it('should be created', () => {
    expect(helloService).toBeTruthy();
  });
  it('should return expected guest hello response', () => {
    const expectedSayHelloToGuest = {
      id: 1,
      content: 'Hello Guest, unknown guest'
    };
    httpClientSpy.get.and.returnValue(of(expectedSayHelloToGuest));
    helloService.sayHelloToGuest().subscribe(response => expect(response)
      .toEqual(expectedSayHelloToGuest, 'expect say hello guest'), fail);
  });
});
