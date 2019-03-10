import { Component, OnInit } from '@angular/core';
import {HelloService} from '../services/hello.service';

@Component({
  selector: 'app-hello',
  templateUrl: './hello.component.html',
  styleUrls: ['./hello.component.css']
})
export class HelloComponent implements OnInit {
  helloGuest: string;
  helloUser: string;
  helloAdmin: string;
  constructor(private helloService: HelloService) { }

  ngOnInit() {
  }

  sayHelloToGuest(): void {
    this.helloService.sayHelloToGuest().subscribe(helloMessage => {
      this.helloGuest = helloMessage['content'];
    });
  }
  sayHelloToUser(): void {
    this.helloService.sayHelloToUser().subscribe(helloMessage => {
      this.helloUser = helloMessage['content'];
    });
  }
  sayHelloToAdmin(): void {
    this.helloService.sayHelloToAdmin().subscribe(helloMessage => {
      this.helloAdmin = helloMessage['content'];
    });
  }
}
