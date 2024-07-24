import {Routes} from '@angular/router';
import {EndpointComponent} from "./endpoint/endpoint.component";
import {ResponseComponent} from "./response/response.component";
import {RestfulComponent} from "./restful/restful.component";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/endpoint",
    pathMatch: "full",
  },
  {
    path: 'endpoint',
    component: EndpointComponent,
  },
  {
    path: 'response',
    component: ResponseComponent,
  },
  {
    path: 'restful',
    component: RestfulComponent,
  },
  {path: '**', redirectTo: '/endpoint'}
];
