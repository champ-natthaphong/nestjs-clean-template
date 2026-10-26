export {};

// stub ใช้แทนแพ็กเกจ ESM-only ที่ unit/e2e ไม่ได้ใช้จริง (@nestjs/jwt, @nestjs/swagger)
const make = (): any =>
  new Proxy(function stub() {}, {
    get: (_t, prop) => {
      if (prop === '__esModule') return true;
      if (prop === 'then') return undefined;
      return make();
    },
    apply: (_t, _this, args: unknown[]) => {
      // ถูกเรียกเป็น decorator จริง (class / property / method)
      if (args.length >= 2) return undefined;
      if (args.length === 1 && typeof args[0] === 'function') return undefined;
      return make();
    },
  });

module.exports = make();
