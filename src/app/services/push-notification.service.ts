import { Injectable, inject } from '@angular/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { SupabaseService } from './supabase';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private supabaseService = inject(SupabaseService);

  constructor() { }

  /**
   * Inicializa la solicitud de permisos y el registro de notificaciones.
   * Debe llamarse únicamente cuando el usuario haya iniciado sesión correctamente.
   */
  async inicializar() {
    // Las notificaciones push nativas solo aplican para Android e iOS
    if (!Capacitor.isNativePlatform()) {
      console.log('EcoSmart Web: Las notificaciones push nativas se omiten en entorno web.');
      return;
    }

    try {
      await this.solicitarPermisos();
    } catch (error) {
      console.error('Error al inicializar notificaciones push nativas:', error);
    }
  }

  /**
   * Solicita permisos de notificaciones al usuario
   */
  private async solicitarPermisos() {
    let permStatus = await PushNotifications.checkPermissions();

    // Si aún no se ha preguntado, se solicita el permiso
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    // Si el usuario concedió los permisos, registramos el dispositivo ante FCM / APNS
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
      this.configurarEventosListener();
    } else {
      console.warn('EcoSmart: El usuario denegó los permisos para notificaciones push.');
    }
  }

  /**
   * Configura los escuchas de eventos nativos de notificaciones
   */
  private configurarEventosListener() {
    // 1. Registro exitoso: Firebase nos entrega el FCM Token único de este dispositivo
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Token FCM obtenido de forma nativa:', token.value);

      // Guardamos el token en localStorage para poder removerlo al cerrar sesión
      localStorage.setItem('ultimo_token_fcm', token.value);

      // Guardamos en la base de datos de Supabase
      await this.guardarTokenEnSupabase(token.value);
    });

    // 2. Error de registro
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error al registrar dispositivo en Firebase:', error);
    });

    // 3. Notificación recibida con la aplicación abierta en primer plano (Foreground)
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Notificación push recibida en primer plano:', notification);
        // Aquí puedes disparar alertas locales visuales premium (por ejemplo, Toasts)
      }
    );

    // 4. El usuario hace clic sobre la notificación (Background o App cerrada)
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        const data = action.notification.data;
        console.log('Usuario interactuó con la notificación (clic):', data);

        // Ejemplo de redirección: si enviamos un ticket_id, podemos navegar directamente a él
        if (data && data.ticket_id) {
          console.log(`Redirigiendo al chat del ticket: ${data.ticket_id}`);
          // Aquí puedes inyectar el Router de Angular y redirigir
        }
      }
    );
  }

  /**
   * Registra o actualiza el Token FCM en la tabla de Supabase
   */
  private async guardarTokenEnSupabase(tokenFCM: string) {
    try {
      const { data: { user } } = await this.supabaseService.obtenerUsuario();
      if (!user) {
        console.warn('EcoSmart: Intento de guardar token FCM sin una sesión de usuario activa.');
        return;
      }

      const plataforma = Capacitor.getPlatform(); // 'android' o 'ios'

      // Guardamos el token usando Upsert (Si ya existe el token, actualiza el usuario)
      const { error } = await this.supabaseService.cliente
        .from('user_push_tokens')
        .upsert({
          usuario_id: user.id,
          fcm_token: tokenFCM,
          dispositivo_info: plataforma,
          actualizado_en: new Date().toISOString()
        }, { onConflict: 'fcm_token' });

      if (error) {
        console.error('Error al insertar el token FCM en Supabase:', error);
      } else {
        console.log('Token FCM vinculado y guardado con éxito en la base de datos.');
      }
    } catch (err) {
      console.error('Excepción al sincronizar el token con Supabase:', err);
    }
  }

  /**
   * Elimina el Token FCM de la base de datos al cerrar sesión.
   * Evita que el siguiente usuario que inicie sesión en el mismo dispositivo reciba notificaciones ajenas.
   */
  async removerTokenFCMAlCerrarSesion() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { data: { user } } = await this.supabaseService.obtenerUsuario();
      if (!user) return;

      const tokenGuardado = localStorage.getItem('ultimo_token_fcm');
      if (tokenGuardado) {
        const { error } = await this.supabaseService.cliente
          .from('user_push_tokens')
          .delete()
          .eq('fcm_token', tokenGuardado)
          .eq('usuario_id', user.id);

        if (error) {
          console.error('Error al eliminar el token FCM en Supabase:', error);
        } else {
          console.log('Token FCM removido exitosamente al cerrar sesión.');
          localStorage.removeItem('ultimo_token_fcm');
        }
      }
    } catch (err) {
      console.error('Excepción al intentar remover el token FCM al cerrar sesión:', err);
    }
  }
}
