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
      // QR Code in top right with adjusted size to remove padding
      frontPage.drawImage(qrCodeImage, {
        x: width * 0.65,
        y: height * 0.5,
        width: 60,  // Reduced from 75 to 60 to remove padding
        height: 60  // Reduced from 75 to 60 to remove padding
      });

      // Name
      frontPage.drawText(userData.name + ' ' + userData.surname, {
        x: width * 0.15,
        y: height * 0.375,
        size: 20,
        color: rgb(1, 1, 1),
        font: boldFont
      });

      // Email
      frontPage.drawText(userData.email || '', {
        x: width * 0.15,
        y: height * 0.3,
        size: 12,
        color: rgb(1, 1, 1),
        font: regularFont
      });

      // Phone
      frontPage.drawText((userData.area_code + ' ' || '') + (userData.phone || ''), {
        x: width * 0.15,
        y: height * 0.24,
        size: 12,
        color: rgb(1, 1, 1),
        font: regularFont
      });

      // Back side
      // Profile URL
      const backUrl = `/u/${userData.slug}`;
      const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" fill="none" viewBox="0 0 90 90"><path fill="#fff" d="M11.94.5 10.5 1.94v7.62L11.94 11h15.23l7.35 7.48h6.04L42 17.04V11L31.5.5H11.94Zm22.58 24.02L27.17 32H14.83l-4.33-4.33V12.44L9.06 11H1.44L0 12.44V32l10.5 10.5h21L42 32v-6.04l-1.44-1.44h-6.04ZM87.81.5h-6.04L47.25 35.02v6.04l1.44 1.44h6.04L89.25 7.98V1.94L87.81.5Zm-6.43 17.85-2.63 2.62v6.7l-7.48 7.35v6.04l1.44 1.44h6.04L89.25 32V19.79l-1.44-1.44h-6.43ZM10.5 68.24l-2.62-2.62H1.44L0 67.06v12.08l10.5 10.5h6.04l1.44-1.45v-6.03l-7.48-7.35v-6.57Zm-9.06-20.6L0 49.08v6.04l34.52 34.52h6.04L42 88.19v-6.03L17.98 58.14h9.19l4.33 4.33v6.56l2.63 2.63h6.43L42 70.21V58.14l-10.5-10.5H1.44Zm57.75 0-1.44 1.44v7.61l1.44 1.45h15.23l4.33 4.33v12.34l-4.33 4.33H58.41l-.66-.66v-18.9l-1.44-1.44h-7.62l-1.44 1.44v28.61l1.44 1.45h30.06l10.5-10.5v-21l-10.5-10.5H59.19Z"/></svg>`;
      
      // Convert SVG to PNG
      const svgBlob = new Blob([iconSvg], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = svgUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 90;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, 90, 90);
      const pngDataUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(svgUrl);
      
      const iconBase64 = pngDataUrl.split(',')[1];
      const iconBytes = Uint8Array.from(atob(iconBase64), c => c.charCodeAt(0));
      const iconImage = await pdfDoc.embedPng(iconBytes);
      
      // Calculate text width for centering
      const backUrlWidth = regularFont.widthOfTextAtSize(backUrl, 14);
      const iconWidth = 30; // Width of the icon
      const spacing = 8; // 1rem = 16px
      
      // Calculate total width of the combined element
      const totalWidth = iconWidth + spacing + backUrlWidth;
      
      // Calculate starting X position to center the entire element
      const startX = (width - totalWidth) / 2;
      
      // Draw icon and URL side by side
      backPage.drawImage(iconImage, {
        x: startX,
        y: height * 0.43,
        width: iconWidth,
        height: 30
      });

      backPage.drawText(backUrl, {
        x: startX + iconWidth + spacing,
        y: height * 0.47,
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