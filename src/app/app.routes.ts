import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './Pages/home/home';
import { Mensajes } from './Pages/mensajes/mensajes';


export const routes: Routes = [
    { path: '', component: Home },   // Home es la página inicial
    { path: 'mensajes', component: Mensajes },
    { path: '**', redirectTo: '' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
