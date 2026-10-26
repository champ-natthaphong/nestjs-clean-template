export const AuthGuard = (_type?: string | string[]) =>
  class MockAuthGuard {
    canActivate(): boolean {
      return true;
    }
  };

export const PassportStrategy = (_strategy: unknown, _name?: string) =>
  class MockPassportStrategy {};

export const PassportModule = {
  register: () => ({ module: class PassportModuleStub {} }),
};
