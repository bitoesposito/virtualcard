import { Injectable, ComponentRef, createComponent, ApplicationRef, Injector, Type } from '@angular/core';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { TempQrComponent } from '../shared/components/temp-qr.component';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private readonly templatePath = '/virtualcard_tpl.pdf';
  private readonly fontsPath = '/fonts/';

  constructor(
    private appRef: ApplicationRef,
    private injector: Injector
  ) {}

  async generateBusinessCard(userData: any): Promise<Uint8Array> {
    try {
      // Fetch the template PDF
      const templateBytes = await fetch(this.templatePath).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(templateBytes);
      
      // Register fontkit
      pdfDoc.registerFontkit(fontkit);
      
      // Get both pages from the template
      const [frontPage, backPage] = pdfDoc.getPages();
      const { width, height } = frontPage.getSize();

      // Embed Blinker fonts
      const regularFontBytes = await fetch(this.fontsPath + 'Blinker-Regular.ttf').then(res => res.arrayBuffer());
      const boldFontBytes = await fetch(this.fontsPath + 'Blinker-Bold.ttf').then(res => res.arrayBuffer());
      const regularFont = await pdfDoc.embedFont(regularFontBytes);
      const boldFont = await pdfDoc.embedFont(boldFontBytes);

      // Generate QR Code
      const qrCodeUrl = `${window.location.origin}/u/${userData.slug}`;
      const qrCodeDataUrl = await this.generateQRCode(qrCodeUrl);
      const qrCodeBase64 = qrCodeDataUrl.split(',')[1];
      const qrCodeBytes = Uint8Array.from(atob(qrCodeBase64), c => c.charCodeAt(0));
      const qrCodeImage = await pdfDoc.embedPng(qrCodeBytes);

      // Front side
      // QR Code in top right
      frontPage.drawImage(qrCodeImage, {
        x: width * 0.7,
        y: height * 0.7,
        width: 100,
        height: 100
      });

      // Name
      frontPage.drawText(userData.name + ' ' + userData.surname, {
        x: width * 0.1,
        y: height * 0.7,
        size: 20,
        color: rgb(1, 1, 1),
        font: boldFont
      });

      // Email
      frontPage.drawText(userData.email || '', {
        x: width * 0.1,
        y: height * 0.6,
        size: 12,
        color: rgb(1, 1, 1),
        font: regularFont
      });

      // Phone
      frontPage.drawText(userData.phone || '', {
        x: width * 0.1,
        y: height * 0.5,
        size: 12,
        color: rgb(1, 1, 1),
        font: regularFont
      });

      // Back side
      // Profile URL
      const backText = 'virtualcard';
      const backUrl = `/u/${userData.slug}`;
      
      // Calculate text widths for centering
      const backTextWidth = boldFont.widthOfTextAtSize(backText, 20);
      const backUrlWidth = regularFont.widthOfTextAtSize(backUrl, 14);
      
      // Center the text horizontally
      const backTextX = (width - backTextWidth) / 2;
      const backUrlX = (width - backUrlWidth) / 2;

      backPage.drawText(backText, {
        x: backTextX,
        y: height * 0.6,
        size: 20,
        color: rgb(1, 1, 1),
        font: boldFont
      });

      backPage.drawText(backUrl, {
        x: backUrlX,
        y: height * 0.4,
        size: 14,
        color: rgb(1, 1, 1),
        font: regularFont
      });

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  private async generateQRCode(url: string): Promise<string> {
    // Create a temporary component
    const componentRef = createComponent(TempQrComponent, {
      environmentInjector: this.appRef.injector,
      elementInjector: this.injector
    });

    // Set the QR code data
    componentRef.instance.qrdata = url;

    // Attach to the DOM with hidden style
    const element = componentRef.location.nativeElement;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    document.body.appendChild(element);
    this.appRef.attachView(componentRef.hostView);

    try {
      // Get the QR code data URL
      const dataUrl = await componentRef.instance.getQRCodeDataUrl();
      return dataUrl;
    } finally {
      // Clean up
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      document.body.removeChild(element);
    }
  }

  downloadPdf(pdfBytes: Uint8Array, filename: string = 'business-card.pdf'): void {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
} 