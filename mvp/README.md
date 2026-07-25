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
- 数据结算：体重、步数、睡眠、心情可编辑，并联动热量、蛋白质、训练容量进度
- API 路由：`/api/parse-meal`，没有 `OPENAI_API_KEY` 时返回规则解析 fallback
- 本地持久化：刷新页面后保留今天的饮食、训练、身体日志和常用餐

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

## 下一步

1. 接 Supabase Auth 并把 local state 改为云端读写。
2. 接 OpenAI 饮食解析，保留待确认，不直接入账。
3. 做常用餐编辑页和训练计划编辑页。
