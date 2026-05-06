import { Injectable } from "@nestjs/common";
import { degrees, PDFDocument, PDFFont, PDFImage, PDFPage, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { IdCardDesign, IdCardDesignObject } from "@id-daddy/shared";
import { StorageService } from "../storage/storage.service";

interface RenderGrid {
  pageSize?: "A4" | "LETTER";
  columns: number;
  rows: number;
  marginMm: number;
  gapMm: number;
}

@Injectable()
export class PdfRendererService {
  constructor(private readonly storage: StorageService) {}

  async renderBulkPdf(design: IdCardDesign, records: Record<string, unknown>[], grid?: RenderGrid) {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
    const layout = this.normalizeGrid(grid);
    const [pageWidth, pageHeight] = layout.pageSize === "LETTER" ? [612, 792] : [595.28, 841.89];
    const margin = this.mm(layout.marginMm);
    const gap = this.mm(layout.gapMm);
    const cardWidth = (pageWidth - margin * 2 - gap * (layout.columns - 1)) / layout.columns;
    const cardHeight = (pageHeight - margin * 2 - gap * (layout.rows - 1)) / layout.rows;

    let page = pdf.addPage([pageWidth, pageHeight]);
    for (let index = 0; index < records.length; index += 1) {
      if (index > 0 && index % (layout.columns * layout.rows) === 0) {
        page = pdf.addPage([pageWidth, pageHeight]);
      }

      const cellIndex = index % (layout.columns * layout.rows);
      const column = cellIndex % layout.columns;
      const row = Math.floor(cellIndex / layout.columns);
      const originX = margin + column * (cardWidth + gap);
      const originY = pageHeight - margin - cardHeight - row * (cardHeight + gap);
      await this.renderCard(pdf, page, design, records[index], originX, originY, cardWidth, cardHeight, font, boldFont);
    }

    return Buffer.from(await pdf.save());
  }

  private async renderCard(
    pdf: PDFDocument,
    page: PDFPage,
    design: IdCardDesign,
    data: Record<string, unknown>,
    originX: number,
    originY: number,
    cardWidth: number,
    cardHeight: number,
    font: PDFFont,
    boldFont: PDFFont
  ) {
    page.drawRectangle({
      x: originX,
      y: originY,
      width: cardWidth,
      height: cardHeight,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 0.4
    });

    if (design.backgroundUrl) {
      const background = await this.fetchPdfImage(pdf, design.backgroundUrl);
      if (background) {
        page.drawImage(background, { x: originX, y: originY, width: cardWidth, height: cardHeight });
      }
    }

    const sx = cardWidth / design.width;
    const sy = cardHeight / design.height;

    for (const object of design.objects) {
      await this.renderObject(pdf, page, object, data, originX, originY, cardHeight, sx, sy, font, boldFont);
    }
  }

  private async renderObject(
    pdf: PDFDocument,
    page: PDFPage,
    object: IdCardDesignObject,
    data: Record<string, unknown>,
    originX: number,
    originY: number,
    cardHeight: number,
    sx: number,
    sy: number,
    font: PDFFont,
    boldFont: PDFFont
  ) {
    const width = object.width * sx;
    const height = object.height * sy;
    const x = originX + object.left * sx;
    const y = originY + cardHeight - object.top * sy - height;
    const angle = degrees(object.angle ?? 0);

    if (object.type === "shape") {
      page.drawRectangle({
        x,
        y,
        width,
        height,
        color: this.hex(object.fill ?? "#e5e7eb"),
        borderColor: this.hex(object.stroke ?? "#111827"),
        borderWidth: object.stroke ? 0.7 : 0,
        rotate: angle,
        opacity: object.opacity ?? 1
      });
      return;
    }

    if (object.type === "text") {
      const size = (object.fontSize ?? 14) * Math.min(sx, sy);
      const text = this.replacePlaceholders(object.text ?? object.placeholder ?? "", data);
      page.drawText(text, {
        x,
        y: y + Math.max(height - size * 1.2, 0),
        size,
        font: object.fontWeight === "700" || object.fontWeight === "bold" ? boldFont : font,
        maxWidth: width,
        color: this.hex(object.fill ?? "#111827"),
        rotate: angle,
        opacity: object.opacity ?? 1
      });
      return;
    }

    if (object.type === "qr") {
      const qrValue = this.replacePlaceholders(object.qrValue ?? object.text ?? "{{id}}", data);
      const png = await QRCode.toBuffer(qrValue, { errorCorrectionLevel: "M", margin: 1 });
      const image = await pdf.embedPng(png);
      page.drawImage(image, { x, y, width, height, rotate: angle });
      return;
    }

    if (object.type === "image") {
      const imageUrl = this.resolveImageUrl(object, data);
      if (!imageUrl) {
        return;
      }
      const image = await this.fetchPdfImage(pdf, imageUrl);
      if (image) {
        page.drawImage(image, { x, y, width, height, rotate: angle, opacity: object.opacity ?? 1 });
      }
    }
  }

  private resolveImageUrl(object: IdCardDesignObject, data: Record<string, unknown>) {
    const key = object.placeholder?.replace(/[{} ]/g, "");
    const value = key ? data[key] : undefined;
    const fallback = object.src ?? data.photoUrl ?? data.imageUrl ?? data.photo;
    return typeof value === "string" ? value : typeof fallback === "string" ? fallback : null;
  }

  private async fetchPdfImage(pdf: PDFDocument, url: string): Promise<PDFImage | null> {
    if (/^data:image\/(png|jpe?g);base64,/i.test(url)) {
      const [header, encoded] = url.split(",", 2);
      const bytes = Buffer.from(encoded, "base64");
      return header.includes("png") ? pdf.embedPng(bytes) : pdf.embedJpg(bytes);
    }

    if (/^s3:\/\//i.test(url)) {
      const object = await this.storage.getBuffer(url);
      if (object.contentType.includes("png")) {
        return pdf.embedPng(object.buffer);
      }
      if (object.contentType.includes("jpg") || object.contentType.includes("jpeg")) {
        return pdf.embedJpg(object.buffer);
      }
      return null;
    }

    if (!/^https?:\/\//i.test(url)) {
      return null;
    }

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const type = response.headers.get("content-type")?.toLowerCase() ?? url.toLowerCase();
    if (type.includes("png")) {
      return pdf.embedPng(bytes);
    }
    if (type.includes("jpg") || type.includes("jpeg")) {
      return pdf.embedJpg(bytes);
    }
    return null;
  }

  private replacePlaceholders(value: string, data: Record<string, unknown>) {
    return value.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key: string) => {
      const replacement = data[key];
      return replacement === null || replacement === undefined ? "" : String(replacement);
    });
  }

  private normalizeGrid(grid?: RenderGrid): RenderGrid {
    return {
      pageSize: grid?.pageSize ?? "A4",
      columns: Math.max(1, Math.min(grid?.columns ?? 2, 5)),
      rows: Math.max(1, Math.min(grid?.rows ?? 5, 10)),
      marginMm: Math.max(0, grid?.marginMm ?? 8),
      gapMm: Math.max(0, grid?.gapMm ?? 4)
    };
  }

  private mm(value: number) {
    return value * 2.834645669;
  }

  private hex(value: string) {
    const normalized = value.replace("#", "");
    const red = parseInt(normalized.slice(0, 2), 16) / 255;
    const green = parseInt(normalized.slice(2, 4), 16) / 255;
    const blue = parseInt(normalized.slice(4, 6), 16) / 255;
    return rgb(Number.isFinite(red) ? red : 0, Number.isFinite(green) ? green : 0, Number.isFinite(blue) ? blue : 0);
  }
}
