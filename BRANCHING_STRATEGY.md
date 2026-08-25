# Branching Strategy — rat Project

> Git workflow, versioning, และ deploy flow สำหรับทุก repo

---

## Trunk-Based + Release Tag

> ทุก repo (ทั้ง common-lib และ services) ใช้ **main branch เดียว + tag ที่ release point**

### หลักการ

```
main ── feat A ── feat B ── fix C ── feat D ──►
                    │           │           │
                 v0.2.0      v0.2.1      v0.3.0   ← release tag เท่านั้นที่ trigger deploy
                 (CI build)  (CI build)  (CI build)
```

- Branch เดียว: `main` — ทุก feature merge เข้า main ผ่าน PR
- ไม่มี `develop` / `release/*` / `sit` / `uat` long-lived branch
- **ทุก commit เข้า main = candidate เท่านั้น ไม่ได้ deploy ทันที**
- Deploy ต่อเมื่อ push **tag** → CI/CD pipeline pickup จาก tag → publish/deploy ตาม environment
- Feature ที่ยังไม่พร้อม = ใช้ **feature flag** ซ่อนไว้ (ดูล่าง)

> **ทำไมไม่ใช้ branch แยกตาม env?** เพราะ branch แยกทำให้ต้อง cherry-pick ข้าม env, drift ง่าย, และ release window ขยายตาม backlog ของ branch ที่ stale ที่สุด — ตรงข้ามกับเป้าหมาย trunk-based

---

## Repo Strategy Matrix

| Repo type                                      | Branch                             | Trigger            | Pipeline                                                                                     |
| ---------------------------------------------- | ---------------------------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| **Module** (`usb-be-*-module-*`)               | trunk-based on `main`              | push to `main`     | reusable workflow `cicd.yml@v1` → lint + sonar + build + npm publish (GitHub Packages)       |
| **Common-lib** (`new_project_name-common-lib`) | trunk-based on `main`              | push tag `vX.Y.Z`  | npm publish ไป GitHub Packages                                                               |
| **Aggregator** (`usb-be-app-mychannel`)        | env-branch (`develop`, `sit`, ...) | push to env branch | reusable `cicd.yml@v2` → unit test + trivy + sonar + build container → ACR → bump helm chart |

> Doc นี้ครอบ **module pattern** เป็นหลัก. Aggregator ใช้ env-branch model คนละ rule (ดู workflow `cicd-dev.yaml` / `cicd-sit.yaml` ใน aggregator repo)

---

## Library Versioning: Semver

| Bump      | เมื่อไหร่                                   | ตัวอย่าง          |
| --------- | ------------------------------------------- | ----------------- |
| **patch** | bug fix, backward compatible                | `0.5.0` → `0.5.1` |
| **minor** | feature ใหม่ หรือ breaking change (pre-1.0) | `0.5.x` → `0.6.0` |
| **major** | ⚠️ breaking change (post-1.0)               | `1.0.0` → `2.0.0` |

### Publishing: GitHub Packages

ทุก module ใช้ `release-it` — bump version + commit + tag + push + npm publish ในคำสั่งเดียว:

```bash
npm run release          # interactive
npm run release -- --patch / --minor / --major
```

```
npm run release
      ↓
build → bump version → git commit → git tag vX.Y.Z → git push
      ↓
push to main → CI workflow (npm-publish.yml) → npm publish
      ↓
GitHub Packages: @entronica/usb-be-*-module-*@X.Y.Z
      ↓
Aggregator npm install: ปกติ pin exact version, ไม่ใช้ range
"@entronica/usb-be-experience-module-taxonomy": "0.0.34"
```

---

## Service Versioning

ทาง service ใช้ tag format ได้ 2 แบบ — ให้ทีมเลือก แต่ **ทั้งทีมในซีรีส์ usb-be ต้องใช้แบบเดียวกัน**:

| Format         | ตัวอย่าง                   | เหมาะสำหรับ                                                    |
| -------------- | -------------------------- | -------------------------------------------------------------- |
| **Semver**     | `v0.0.5`, `v0.1.0`         | service ที่มี contract ภายนอก / มี consumer ตามรุ่น            |
| **Date-based** | `20260516.1`, `20260516.2` | service ที่ deploy บ่อย, ไม่จำเป็นต้องคุย version กับ consumer |

> เลือกแล้วยึดยาวๆ — อย่าสลับ format กลางทาง CI rule จะ break

---

## Workflow

### Feature Development

```bash
# 1. แตก feature branch จาก main
git checkout -b feature/add-cache main

# 2. ทำงาน + commit (conventional commits)
git commit -m "feat(cache): add base cache service"

# 3. เปิด PR → review → merge เข้า main
#    CI ต้องผ่าน: lint + test + build

# 4. Release → publish to GitHub Packages
npm run release          # interactive: patch/minor/major
```

### Hotfix (PROD Bug)

```bash
# branch จาก main (ไม่ branch จาก tag — ป้องกัน drift)
git checkout -b hotfix/fix-crash main
git commit -m "fix: resolve crash on login"

# PR → merge เข้า main → release patch
npm run release -- --patch
# → push tag → CI publish → aggregator team bump version + redeploy
```

> ⚠️ **ไม่ branch จาก tag เก่า** — เพราะจะทำให้ main + hotfix divergent ลำบาก. main ต้องเป็น source of truth เสมอ
> Module patch ที่ publish แล้ว, aggregator (`usb-be-app-mychannel`) ต้อง bump exact version + redeploy เอง

---

## Feature Flags (แทน Long-lived Branches)

> ใช้ **OpenFeature** แทน branch separation — merge code ได้เลย แต่ซ่อน feature ไว้

### เมื่อไหร่ใช้ Feature Flag?

| สถานการณ์                                     | ใช้ Flag?                                  |
| --------------------------------------------- | ------------------------------------------ |
| Feature ยังทำไม่เสร็จ แต่อยาก merge เข้า main | ✅ ใช้ flag ซ่อนไว้                        |
| Feature เสร็จแล้ว แต่ยังไม่อยากเปิดใน PROD    | ✅ ใช้ flag ควบคุม                         |
| Bug fix ทั่วไป                                | ❌ ไม่จำเป็น — merge + tag + deploy ได้เลย |
| Refactor ที่ไม่เปลี่ยน behavior               | ❌ ไม่จำเป็น                               |

### วิธีใช้ OpenFeature ใน Service

#### Step 1: ประกาศ flag ใน YAML config

```yaml
# assets/config/local.config.yaml
feature-flags:
  enable-new-registration: true
  enable-payment-v2: false # ← ซ่อนไว้ก่อน
```

#### Step 2: Import `FeatureFlagModule` ใน `AppModule`

`AppModule` ของ template มี `FeatureFlagModule.forRoot(...)` อยู่แล้ว — อ่าน flags จาก YAML ผ่าน `ConfigService` อัตโนมัติ:

```typescript
import { ConfigService, FeatureFlagModule } from '@corpais/rat-common-lib';

@Module({
  imports: [
    FrameworkModule.register({
      /* ... */
    }),
    FeatureFlagModule.forRoot({
      flags: new ConfigService().get('feature-flags') ?? {},
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

#### Step 3: Inject `FeatureFlagService` ใน Service

```typescript
import { FeatureFlagService } from '@corpais/rat-common-lib';

@Injectable()
export class RegistrationService {
  constructor(private readonly featureFlag: FeatureFlagService) {}

  async processRegistration(data: CreateRegistrationDto) {
    if (await this.featureFlag.isEnabled('enable-new-registration')) {
      // ✅ New flow
      return this.newRegistrationFlow(data);
    }
    // Old flow (fallback)
    return this.legacyRegistrationFlow(data);
  }
}
```

#### FeatureFlagService API

| Method                              | Return             | Description                                 |
| ----------------------------------- | ------------------ | ------------------------------------------- |
| `isEnabled(flagKey, defaultValue?)` | `Promise<boolean>` | ตรวจว่า flag เปิดอยู่ไหม (default: `false`) |
| `getString(flagKey, defaultValue?)` | `Promise<string>`  | อ่านค่า string จาก flag                     |
| `getNumber(flagKey, defaultValue?)` | `Promise<number>`  | อ่านค่า number จาก flag                     |

#### Deploy Flow with Feature Flags

```
Dev merge feature → main (flag=false)
                     ↓
              Tag → Deploy DEV/SIT — เปิด flag=true ใน config dev/sit เพื่อ test
                     ↓
              Tag → Deploy PROD (flag=false ใน config prod) — safe
                     ↓
           QA passed → เปลี่ยน flag=true ใน PROD config → tag patch → redeploy
                     ↓
           Stable → ลบ flag + old code → clean up
```

---

## PR Rules

| Rule                       | ค่า                                                   |
| -------------------------- | ----------------------------------------------------- |
| **Approve**                | ทุกคนใน squad ต้องกด approve                          |
| **CI ต้องผ่าน**            | lint + test + build                                   |
| **Protected branch**       | `main` — ต้องผ่าน PR                                  |
| **Feature branch ลบเมื่อ** | merge เข้า main แล้ว                                  |
| **Tag เฉพาะ main**         | ไม่ tag จาก feature branch / hotfix branch ก่อน merge |

---

## Quick Reference

```
Dev ทำงาน         → feature/* (จาก main) → PR → main
Release           → push tag จาก main → CI/CD build & deploy
PROD bug          → hotfix/* (จาก main) → PR → main → tag patch → deploy
Feature ยังไม่เสร็จ → merge ด้วย feature flag (ซ่อนไว้) → เปิด flag เมื่อพร้อม
```
