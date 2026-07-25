# GymPlate MVP

这是从静态 demo 走向可交付产品的 Next.js 版本。

## 本地运行

```bash
cd mvp
pnpm install
cp .env.example .env.local
pnpm run dev
```

## 数据库

在 Supabase SQL Editor 执行：

```text
mvp/supabase/schema.sql
mvp/supabase/seed-open-data.sql
```

如果 `.env.local` 设置了 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，App 会尝试读取当前 Supabase session，并把 MVP 状态同步到 `app_snapshots`。没有配置或没有登录时，自动回退到浏览器本地保存。

当前登录入口使用 Supabase 邮箱 Magic Link。需要在 Supabase Auth 里开启 Email provider，并把部署域名加入 Redirect URLs。

重新生成开放数据 seed：

```bash
pnpm run seed:open-data
```

## 当前交付切片

- App Router 移动端三页：训练 / 饮食 / 数据
- Supabase schema：profile、daily records、meal entries、meal templates、workout logs
- 开放数据 seed：1555 条中文食物，360 条带 GIF/步骤的训练动作
- 饮食记录：口述生成待确认餐卡，确认后才入账；常用餐模板可一键加入；克数和热量、蛋白、碳水、脂肪都可手动修正
- 训练记录：每个动作按组记录重量/次数/完成状态，支持随时添加或删除组
- 训练计划：可设置每周训练天数、每天动作数、每动作组数，并生成固定一周计划
- 数据结算：体重、步数、睡眠、心情可编辑，并联动热量、蛋白质、训练容量进度
- 基础设置：身高、体重、年龄、性别、增肌/减脂目标会计算 BMI、BMR 和目标摄入
- API 路由：`/api/parse-meal`，没有 `OPENAI_API_KEY` 时返回规则解析 fallback
- 持久化：默认本地保存；配置 Supabase 且用户已登录后同步到云端 `app_snapshots`
- 登录入口：Supabase 邮箱 Magic Link 登录/退出，登录状态变化后自动重新拉取云端状态

## 验证

```bash
pnpm run build
```

注意：不要把 `pnpm run build` 和 dev server / runtime test 并行运行，它们都会写 `.next`。

当前已通过 Next.js 生产构建。根目录旧静态 demo 的回归测试也会检查 MVP 结构：

```bash
cd ..
npm test
npm run test:mvp-runtime
```

## 部署

见 [DEPLOYMENT.md](DEPLOYMENT.md)。当前建议部署到 Vercel，Root Directory 设为 `mvp`。

## 下一步

1. 部署到 Vercel/Sites，并配置 Supabase Redirect URL。
2. 接 OpenAI 饮食解析，保留待确认，不直接入账。
3. 做常用餐编辑页和训练计划编辑页。
4. 把 `app_snapshots` 中的 MVP 数据拆写到规范化表，支撑长期趋势图。
5. 如需社交登录，再接 Google / Apple OAuth。
