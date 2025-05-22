import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ApiResponse } from '../models/api.models';

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
     * @param severity Tipo di messaggio (success/error)
     * @param message Messaggio da mostrare
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
     * Gestisce le risposte API mostrando un messaggio appropriato
     * @param response Risposta API
     * @param defaultMessage Messaggio predefinito se la risposta non contiene un messaggio
     */
    handleApiResponse<T>(response: ApiResponse<T>, defaultMessage: string): void {
        if (response.success) {
            this.showMessage('success', response.message || defaultMessage);
        } else {
            this.showMessage('error', response.message || defaultMessage);
        }
    }

    /**
     * Gestisce gli errori HTTP mostrando un messaggio appropriato
     * @param error Errore HTTP
     * @param defaultMessage Messaggio predefinito se l'errore non contiene un messaggio
     */
    handleError(error: any, defaultMessage: string): void {
        let errorMessage = defaultMessage;

        if (error?.error?.message) {
            errorMessage = error.error.message;
        } else if (error?.error?.data?.message) {
            errorMessage = error.error.data.message;
        } else if (typeof error?.error === 'string') {
            try {
                const parsed = JSON.parse(error.error);
                errorMessage = parsed.message || defaultMessage;
            } catch {
                errorMessage = error.error;
            }
        } else if (error?.message) {
            errorMessage = error.message;
        }

        this.showMessage('error', errorMessage);
    }

    /**
     * Gestisce le risposte di successo delle chiamate API
     * @param message Messaggio di successo da mostrare all'utente
     */
    handleSuccess(message: string): void {
        this.showMessage('success', message);
    }

    /**
     * Gestisce le risposte di warning delle chiamate API
     * @param message Messaggio di warning da mostrare all'utente
     */
    handleWarning(message: string): void {
        this.showMessage('error', message);
    }
}
