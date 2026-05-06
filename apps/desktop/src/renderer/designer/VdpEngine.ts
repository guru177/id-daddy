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
            canvas.loadFromJSON(JSON.stringify(json), () => {
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

const imageCache = new Map<string, fabric.Image>();

async function processCanvasObjects(canvas: fabric.StaticCanvas, member: Member) {
  const objects = canvas.getObjects();
  
  const tasks = objects.map(async (obj) => {
    // 1. Text Optimization: Only check if it likely contains a variable
    if (obj.type === 'i-text' || obj.type === 'textbox') {
      const textObj = obj as any;
      let text = textObj.placeholder || textObj.text;
      
      if (text && text.includes('{{')) {
        const matches = text.match(/{{([^}]+)}}/g);
        if (matches) {
          matches.forEach((match: string) => {
            const key = match.replace(/[{}]/g, '').trim() as keyof Member;
            const val = member[key] || (member.customFields && member.customFields[key]) || '';
            text = text.replace(match, val as string);
          });
          textObj.set('text', text);
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
