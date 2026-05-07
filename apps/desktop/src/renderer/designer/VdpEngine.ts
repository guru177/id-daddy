import { fabric } from 'fabric';
import { Member } from './store';

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
          await processCanvasObjects(canvas, member);

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

    await processCanvasObjects(canvas, member);

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

async function processCanvasObjects(canvas: fabric.StaticCanvas, member: Member) {
  const objects = canvas.getObjects();

  const tasks = objects.map(async (obj) => {
    if (obj.type === 'i-text' || obj.type === 'textbox') {
      const textObj = obj as any;
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

          // CRITICAL KERNING FIX: Convert logical spaces to non-breaking spaces (\u00A0).
          // Heavy fonts collapse standard spaces during Fabric's chunk rendering.
          if (text.includes(' ')) {
            text = text.replace(/ /g, '\u00A0');
          }

          textObj.set('text', text);

          // Re-calculate variable colors specifically for this member's string length
          if (textObj.variableColors && Object.keys(textObj.variableColors).length > 0) {
            const charStyles: Record<number, { fill: string }> = {};
            let charPos = 0;
            const segments = rawTemplate.split(/({{[^}]+}})/g);
            let lastColor: string | null = null;

            for (const segment of segments) {
              if (!segment) continue;
              const varMatch = segment.match(/^{{([^}]+)}}$/);
              if (varMatch) {
                const varKey = varMatch[1].trim() as keyof Member;
                const varValue = String(member[varKey] ?? (member.customFields && member.customFields[varKey as string]) ?? '');
                const varColor = textObj.variableColors[varKey as string];
                if (varColor) lastColor = varColor;

                if (varColor && varValue.length > 0) {
                  const styleInstance = { fill: varColor };
                  for (let i = 0; i < varValue.length; i++) {
                    charStyles[charPos + i] = styleInstance;
                  }
                }
                charPos += varValue.length;
              } else {
                if (lastColor) {
                  const spaceStyle = { fill: lastColor, _isSpace: true };
                  for (let i = 0; i < segment.length; i++) {
                    charStyles[charPos + i] = spaceStyle;
                  }
                }
                charPos += segment.length;
              }
            }
            textObj.set('styles', { 0: charStyles });
            textObj.set('charSpacing', 0);
            if (textObj.initDimensions) textObj.initDimensions();
          }
        }
      }
    }

    // 2. Image Optimization: Use cache for repeated images (logos, etc)
    const placeholder = (obj as any).placeholder;
    if (placeholder) {
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
      }
    }
  });

  await Promise.all(tasks);
  canvas.renderAll();
}
