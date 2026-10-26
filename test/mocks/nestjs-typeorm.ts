// stub ของ @nestjs/typeorm สำหรับ unit/e2e (Repository ถูก mock อยู่แล้ว)
export const InjectRepository = () => () => undefined;
export const InjectDataSource = () => () => undefined;
export const getRepositoryToken = (entity: unknown) => `${String(entity)}Repository`;

export const TypeOrmModule = {
  forRoot: () => ({ module: class TypeOrmRootStub {} }),
  forRootAsync: () => ({ module: class TypeOrmRootAsyncStub {} }),
  forFeature: () => ({ module: class TypeOrmFeatureStub {} }),
};
