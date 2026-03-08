import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'ingreso',
    loadComponent: () => import('./ingreso/ingreso.page').then( m => m.IngresoPage)
  },
  {
    path: 'terminos',
    loadComponent: () => import('./terminos/terminos.page').then( m => m.TerminosPage)
  },
  {
    path: 'politica',
    loadComponent: () => import('./politica/politica.page').then( m => m.PoliticaPage)
  },
];
