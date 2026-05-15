import { fabric } from 'fabric';
import { Member } from './store';
import { generateSecurityImageURL } from './Panels';

export interface VdpResult {
  memberId: string;
  front: string;
  back: string;
}

const CONCURRENCY_LIMIT = 2; // Process 2 members at a time

export async function generatePreviews(
  design: any,
  members: Member[],
  onProgress?: (result: VdpResult) => void,
  signal?: AbortSignal
): Promise<VdpResult[]> {
  if (!design || !design.config) return [];

  const width = design.config.orientation === 'horizontal' ? 1016 : 638;
  const height = design.config.orientation === 'horizontal' ? 638 : 1016;
  const results: VdpResult[] = [];

  for (let i = 0; i < members.length; i += CONCURRENCY_LIMIT) {
    if (signal?.aborted) break;
    const batch = members.slice(i, i + CONCURRENCY_LIMIT);

    await Promise.all(batch.map(async (member) => {
      if (signal?.aborted) return;

      try {
        const renderSide = async (json: any, isBack: boolean) => {
          if (!json || signal?.aborted) return '';

          const canvasEl = document.createElement('canvas');
          canvasEl.width = width;
          canvasEl.height = height;

          const canvas = new fabric.StaticCanvas(canvasEl, {
            width,
            height,
            enableRetinaScaling: false,
          });

          const bgColor = isBack ? design.config.backgroundColorBack : design.config.backgroundColorFront;

          // Set background color with absolute certainty
          await new Promise<void>(resolve => {
            canvas.setBackgroundColor(bgColor || '#ffffff', () => resolve());
          });

          // Load JSON - stringify it to ensure it's treated as fresh data
          await new Promise<void>(resolve => {
            canvas.loadFromJSON(JSON.stringify(json), async () => {
              // Wait for all fonts to be completely ready before letting Fabric measure text chunks
              if (document.fonts) {
                await document.fonts.ready;
              }
              canvas.renderAll();
              resolve();
            });
          });

          // Inject member data
          await processCanvasObjects(canvas, member, design.config.safeMargin);

          // Add slot punch if configured
          if (design.config.slotPunch !== 'none') {
            const punch = new fabric.Rect({
              width: 160,
              height: 35,
              rx: 12,
              ry: 12,
              fill: '#d1d5db',
              left: design.config.slotPunch === 'short' ? width / 2 : 30,
              top: design.config.slotPunch === 'short' ? 30 : height / 2,
              angle: design.config.slotPunch === 'long' ? 90 : 0,
              originX: 'center',
              originY: 'center',
              // @ts-ignore
              name: 'slot-punch-overlay'
            });
            canvas.add(punch);
            punch.bringToFront();
          }

          // Force multiple renders to ensure image layers are flushed to the buffer
          canvas.renderAll();
          canvas.renderAll();

          const dataUrl = canvas.toDataURL({
            format: 'jpeg',
            multiplier: 0.5,
            quality: 0.8
          });

          canvas.dispose();
          return dataUrl;
        };

        const [front, back] = await Promise.all([
          renderSide(design.front, false),
          renderSide(design.back, true)
        ]);

        const result = {
          memberId: member.id,
          front,
          back
        };

        results.push(result);
        if (onProgress) onProgress(result);
      } catch (err) {
        console.error("VDP Render Error:", err);
      }
    }));
  }

  return results;
}

export async function generateSingleHighRes(design: any, member: Member, multiplier: number = 3): Promise<{ front: string, back: string }> {
  const width = design.config.orientation === 'horizontal' ? 1013 : 638;
  const height = design.config.orientation === 'horizontal' ? 638 : 1013;

  const renderSide = async (json: any, isBack: boolean) => {
    if (!json) return '';
    const canvas = new fabric.StaticCanvas(null, {
      width, height,
      backgroundColor: isBack ? design.config.backgroundColorBack : design.config.backgroundColorFront
    });

    await new Promise<void>(resolve => {
      canvas.loadFromJSON(JSON.stringify(json), () => {
        canvas.renderAll();
        resolve();
      });
    });

    await processCanvasObjects(canvas, member, design.config.safeMargin);

    if (design.config.slotPunch !== 'none') {
      const punch = new fabric.Rect({
        width: 160,
        height: 35,
        rx: 12,
        ry: 12,
        fill: '#d1d5db',
        left: design.config.slotPunch === 'short' ? width / 2 : 30,
        top: design.config.slotPunch === 'short' ? 30 : height / 2,
        angle: design.config.slotPunch === 'long' ? 90 : 0,
        originX: 'center',
        originY: 'center',
        // @ts-ignore
        name: 'slot-punch-overlay'
      });
      canvas.add(punch);
      punch.bringToFront();
    }

    canvas.renderAll();
    canvas.renderAll();

    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: multiplier
    });

    canvas.dispose();
    return dataUrl;
  };

  const [front, back] = await Promise.all([
    renderSide(design.front, false),
    renderSide(design.back, true)
  ]);

  return { front, back };
}

const imageCache = new Map<string, fabric.Image>();

async function processCanvasObjects(canvas: fabric.StaticCanvas, member: Member, globalSafeMargin?: number) {
  const objects = canvas.getObjects();

  const tasks = objects.map(async (obj) => {
    if (obj.type === 'i-text' || obj.type === 'textbox') {
      const textObj = obj as any;
      
      // FIX: Align originX with textAlign to ensure it expands correctly when text changes
      if (textObj.textAlign === 'center' && textObj.originX !== 'center') {
        const currentLeft = textObj.left || 0;
        const currentWidth = (textObj.width || 0) * (textObj.scaleX || 1);
        textObj.set({ originX: 'center', left: currentLeft + (currentWidth / 2) });
      } else if (textObj.textAlign === 'right' && textObj.originX !== 'right') {
        const currentLeft = textObj.left || 0;
        const currentWidth = (textObj.width || 0) * (textObj.scaleX || 1);
        textObj.set({ originX: 'right', left: currentLeft + currentWidth });
      }

      const rawTemplate = textObj.placeholder || textObj.text;
      let text = rawTemplate;

      if (text && text.includes('{{')) {
        const matches = text.match(/{{([^}]+)}}/g);
        if (matches) {
          matches.forEach((match: string) => {
            const key = match.replace(/[{}]/g, '').trim() as keyof Member;
            const val = member[key] || (member.customFields && member.customFields[key]) || '';
            text = text.replace(match, val as string);
          });

          textObj.set('text', text);

          // Re-calculate variable colors — every character gets an explicit style entry
          // so Fabric uses the same measurement path across the whole string.
          if (textObj.variableColors && Object.keys(textObj.variableColors).length > 0) {
            const baseFill = textObj.fill || '#000000';
            const charColors: string[] = [];
            const segments = rawTemplate.split(/({{[^}]+}})/g);

            for (const segment of segments) {
              if (!segment) continue;
              const varMatch = segment.match(/^{{([^}]+)}}$/);
              if (varMatch) {
                const varKey = varMatch[1].trim() as keyof Member;
                const varValue = String(member[varKey] ?? (member.customFields && member.customFields[varKey as string]) ?? '');
                const varColor = textObj.variableColors[varKey as string] || baseFill;
                for (let i = 0; i < varValue.length; i++) charColors.push(varColor);
              } else {
                for (let i = 0; i < segment.length; i++) charColors.push(baseFill);
              }
            }

            // Map to Fabric per-line format
            const resolvedLines = text.split('\n');
            const newStyles: any = {};
            let charIdx = 0;
            for (let lineIdx = 0; lineIdx < resolvedLines.length; lineIdx++) {
              const line = resolvedLines[lineIdx];
              const lineStyles: Record<number, { fill: string }> = {};
              for (let col = 0; col < line.length; col++) {
                lineStyles[col] = { fill: charColors[charIdx] ?? baseFill };
                charIdx++;
              }
              if (lineIdx < resolvedLines.length - 1) charIdx++;
              newStyles[lineIdx] = lineStyles;
            }

            textObj.set('styles', newStyles);
            textObj.set('charSpacing', 0);
            if (textObj.initDimensions) textObj.initDimensions();
          }
        }
      }

      // Smart Margin & Shift-to-Fit: prevent variable text from running off the edges
      if (textObj.initDimensions) textObj.initDimensions();
      textObj.setCoords();

      if (canvas && typeof canvas.getWidth === 'function') {
        const margin = textObj.safeMargin ?? globalSafeMargin ?? 25;
        const cw = canvas.getWidth();
        const currentWidth = (textObj.width || 0) * (textObj.scaleX || 1);
        let allowedWidth = currentWidth;
        const originX = textObj.originX || 'left';
        const posX = textObj.left || 0;

        if (originX === 'left') {
          if (posX + currentWidth > cw - margin) allowedWidth = (cw - margin) - posX;
        } else if (originX === 'right') {
          if (posX - currentWidth < margin) allowedWidth = posX - margin;
        } else if (originX === 'center') {
          const rightSpace = (cw - margin) - posX;
          const leftSpace = posX - margin;
          const maxHalfWidth = Math.min(rightSpace, leftSpace);
          if (currentWidth / 2 > maxHalfWidth) allowedWidth = maxHalfWidth * 2;
        }

        if (allowedWidth < currentWidth && allowedWidth > 0) {
          const scaleRatio = allowedWidth / currentWidth;
          textObj.set('scaleX', (textObj.scaleX || 1) * scaleRatio);
          textObj.set('scaleY', (textObj.scaleY || 1) * scaleRatio);
          textObj.setCoords();
        }
      }
    }

    // 2. Image Optimization: Use cache for repeated images (logos, etc)
    const placeholder = (obj as any).placeholder;
    if (placeholder) {
      if (placeholder === '{{barcode}}' || placeholder === '{{qr_code}}' || placeholder === '{{pdf417}}' || placeholder === '{{datamatrix}}') {
        const dataUrl = await generateSecurityImageURL(obj, member);
        if (dataUrl) {
          await new Promise<void>(resolve => {
            const options: any = { crossOrigin: 'anonymous' };
            fabric.Image.fromURL(dataUrl, (img) => {
              if (img) {
                const targetW = (obj.width || 0) * (obj.scaleX || 1);
                const targetH = (obj.height || 0) * (obj.scaleY || 1);

                img.set({
                  left: obj.left,
                  top: obj.top,
                  scaleX: targetW / (img.width || 1),
                  scaleY: targetH / (img.height || 1),
                  angle: obj.angle,
                  originX: obj.originX,
                  originY: obj.originY,
                  clipPath: obj.clipPath
                });

                const idx = canvas.getObjects().indexOf(obj);
                if (idx > -1) {
                  canvas.remove(obj);
                  canvas.insertAt(img, idx, false);
                }
              }
              resolve();
            }, options);
          });
        }
      } else {
        const key = placeholder.replace(/[{}]/g, '').trim();
        let imageUrl = '';

        if (key === 'photo') imageUrl = member.profileImage;
        else if (key === 'signature') imageUrl = member.signature;
        else if (key === 'fingerprint') imageUrl = member.fingerprint;
        else if (key === 'logo') imageUrl = member.divisionLogo;
        else if (member.customFields && member.customFields[key]) {
          imageUrl = member.customFields[key];
        }

        if (imageUrl) {
          await new Promise<void>(resolve => {
            const options: any = {};
            if (imageUrl.startsWith('http')) {
              options.crossOrigin = 'anonymous';
            }

            fabric.Image.fromURL(imageUrl, (img) => {
              if (img) {
                const targetW = (obj.width || 0) * (obj.scaleX || 1);
                const targetH = (obj.height || 0) * (obj.scaleY || 1);

                img.set({
                  left: obj.left,
                  top: obj.top,
                  scaleX: targetW / (img.width || 1),
                  scaleY: targetH / (img.height || 1),
                  angle: obj.angle,
                  originX: obj.originX,
                  originY: obj.originY,
                  clipPath: obj.clipPath
                });

                const idx = canvas.getObjects().indexOf(obj);
                if (idx > -1) {
                  canvas.remove(obj);
                  canvas.insertAt(img, idx, false);
                }
              }
              resolve();
            }, options);
          });
        } else {
          // No image — load a grey SVG placeholder that inherits the original clipPath (e.g. circle crop)
          const w = obj.width || 100;
          const h = obj.height || 100;
          const svgPlaceholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='${w}' height='${h}' fill='%23d1d5db'/><circle cx='${w/2}' cy='${h*0.38}' r='${Math.min(w,h)*0.18}' fill='%239ca3af'/><ellipse cx='${w/2}' cy='${h*0.72}' rx='${Math.min(w,h)*0.24}' ry='${Math.min(w,h)*0.16}' fill='%239ca3af'/></svg>`;

          await new Promise<void>(resolve => {
            fabric.Image.fromURL(svgPlaceholder, (img) => {
              if (img) {
                img.set({
                  left: obj.left,
                  top: obj.top,
                  scaleX: obj.scaleX,
                  scaleY: obj.scaleY,
                  angle: obj.angle,
                  originX: obj.originX,
                  originY: obj.originY,
                  clipPath: obj.clipPath,
                  selectable: false,
                  evented: false,
                });
                const idx = canvas.getObjects().indexOf(obj);
                if (idx > -1) {
                  canvas.remove(obj);
                  canvas.insertAt(img, idx, false);
                }
              }
              resolve();
            }, {});
          });
        }
      }
    }
  });

  await Promise.all(tasks);
  canvas.renderAll();
}
