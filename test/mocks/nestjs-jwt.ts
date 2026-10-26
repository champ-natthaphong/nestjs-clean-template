export class JwtService {
  sign(): string {
    return '';
  }
  verify(): unknown {
    return {};
  }
}

export const JwtModule = {
  register: () => ({ module: class JwtModuleStub {} }),
  registerAsync: () => ({ module: class JwtModuleAsyncStub {} }),
};
