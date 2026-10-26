const make = (): any =>
  new Proxy((...args: unknown[]) => args.join(' '), {
    get: () => make(),
    apply: (_target, _this, args: unknown[]) => args.join(' '),
  });

const chalk = make();

export default chalk;
