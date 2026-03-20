import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { PublicGuard } from './guards/public.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'ingreso',
    canActivate: [PublicGuard],
    loadComponent: () => import('./ingreso/ingreso.page').then(m => m.IngresoPage)
  },
  {
    path: 'registro',
    canActivate: [PublicGuard],
    loadComponent: () => import('./registro/registro.page').then(m => m.RegistroPage)
  },
  {
    path: 'dashboard-estudiante',
    canActivate: [AuthGuard],
    loadComponent: () => import('./dashboard-estudiante/dashboard-estudiante.page').then(m => m.DashboardEstudiantePage)
  },
  {
    path: 'perfil',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/perfil-modal/perfil-modal.component').then(m => m.PerfilModalComponent)
  },
  {
    path: 'dashboard-admin',
    canActivate: [AdminGuard],
    loadComponent: () => import('./dashboard-admin/dashboard-admin.page').then( m => m.DashboardAdminPage)
  },
  {
    path: 'constructor-curso/:id',
    canActivate: [AdminGuard],
    loadComponent: () => import('./constructor-curso/constructor-curso.page').then( m => m.ConstructorCursoPage)
  },
  { 
    path: 'terminos', 
    loadComponent: () => import('./terminos/terminos.page').then(m => m.TerminosPage) 
  },
  { 
    path: 'politica', 
    loadComponent: () => import('./politica/politica.page').then(m => m.PoliticaPage) 
  },
  {
    path: 'catalogo',
    canActivate: [AuthGuard],
    loadComponent: () => import('./catalogo/catalogo.page').then((m) => m.CatalogoPage),
  },
  {
    path: 'perfil',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/perfil-modal/perfil-modal.component').then((m) => m.PerfilModalComponent),
  }
];
