import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login';
import { Signin } from './signin';
import { Home } from './Pages/home/home';
import { Mensajes } from './Pages/mensajes/mensajes';
import { Simulador } from './Components/simulador/simulador';
import { Ranking } from './Components/ranking/ranking';



export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signin', component: Signin },
  { path: 'home', component: Home },
  { path: 'mensajes', component: Mensajes },
  { path: 'simulador', component: Simulador },
  { path: 'ranking', component: Ranking },
  { path: '**', redirectTo: 'login' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
