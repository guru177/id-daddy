const { validateSync, IsObject, IsString } = require('class-validator');
const { plainToClass } = require('class-transformer');

class CreateTemplateDto {
  constructor() {}
}
Object.defineProperty(CreateTemplateDto.prototype, "name", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: void 0
});
Object.defineProperty(CreateTemplateDto.prototype, "design", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: void 0
});

IsString()(CreateTemplateDto.prototype, "name");
IsObject()(CreateTemplateDto.prototype, "design");

const obj = plainToClass(CreateTemplateDto, { name: "test", design: { id: 1 } });
console.log('Parsed Object:', obj);
console.log('Validation Errors:', validateSync(obj, { whitelist: true }));
