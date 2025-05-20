import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(
        private messageService: MessageService,
        private http: HttpClient
    ) {}

    /**
     * Gestisce il messaggio di errore o successo in modo centralizzato
     * @param error Oggetto errore ricevuto dalla chiamata API
     * @param defaultMessage Messaggio di errore predefinito se l'errore non contiene un messaggio specifico
     */
    showMessage(severity: 'success' | 'error', message: string): void {
      let summary = '';
  
      switch (severity) {
          case 'success':
              summary = 'Successo';
              break;
          case 'error':
              summary = 'Errore';
              break;
      }
  
      this.messageService.add({
          severity,
          summary,
          detail: message
      });
  }

    /**
     * Gestisce le risposte di errore delle chiamate API mostrando un messaggio di conferma.
     * @param message Messaggio di successo da mostrare all'utente
     */
    handleError(error: any, defaultMessage: string): void {
      let errorMessage = defaultMessage;
  
      // Controllo struttura dell'errore
      if (error?.error?.message) {
          errorMessage = error.error.message;
      } else if (typeof error?.error === 'string') {
          try {
              // In caso venga restituito JSON come stringa
              const parsed = JSON.parse(error.error);
              errorMessage = parsed.message || defaultMessage;
          } catch (e) {
              errorMessage = error.error;
          }
      } else if (error?.message) {
          errorMessage = error.message;
      }
  
      this.showMessage('error', errorMessage);
  }

    /**
     * Gestisce le risposte di successo delle chiamate API mostrando un messaggio di conferma.
     * @param message Messaggio di successo da mostrare all'utente
     */
    handleSuccess(message: string): void {
        this.showMessage('success', message); // Mostra il successo
    }
    handleWarning(defaultMessage: string): void {
        const errorMessage = defaultMessage;
        this.showMessage('error', errorMessage); // Mostra l'errore
    }
}
