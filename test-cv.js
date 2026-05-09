const { validateSync, IsObject, IsString, MinLength } = require('class-validator');
const { plainToClass } = require('class-transformer');

class Dto {
  name;
  design;
}
// Without TS decorators we can't easily reproduce it in JS. I'll just check if it's the size.
