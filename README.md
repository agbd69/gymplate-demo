# GymPlate Demo

一个移动端优先的健身 + 饮食记录 Demo。

## 功能

- 训练：根据目标和部位生成实用中文动作计划，展示动作 GIF、动作要点和组数记录。
- 饮食：只保留一个口述式输入框，输入“早餐两个鸡蛋，一杯牛奶”这类文本后估算热量和宏量营养。
- 数据：记录体重、步数、睡眠、心情，并生成每日结算和历史记录。

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/dashboard.html
```

## 测试

```bash
npm test
node tests/ui-v7.test.mjs
```

## 数据来源

- 动作 GIF 和基础动作数据：`hasaneyldrm/exercises-dataset`
- 中文食物基础库：`Sanotsu/china-food-composition-data`

## AI 饮食解析

本地静态预览会使用内置中文食物库兜底解析。部署到支持 serverless API 的环境后，可以设置：

```text
OPENAI_API_KEY=...
```

接口位置：

```text
api/parse-meal.js
```
