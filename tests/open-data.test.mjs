import assert from "node:assert/strict";
import { normalizeExercise, normalizeFood } from "../open-data.mjs";

const exercise = normalizeExercise({
  id: "0001",
  name: "barbell bench press",
  category: "chest",
  body_part: "chest",
  equipment: "barbell",
  instructions: {
    zh: "躺在卧推凳上，双脚踩稳地面。收紧肩胛骨，把杠铃下放到胸口，再推回起始位置。"
  },
  instruction_steps: {
    zh: ["躺在卧推凳上，双脚踩稳地面。", "收紧肩胛骨，把杠铃下放到胸口。", "推回起始位置。"]
  },
  gifUrl: "videos/0001-demo.gif",
  thumbnail: "https://example.com/bench.png",
  attribution: "© Gym visual — https://gymvisual.com/"
});

assert.equal(exercise.id, "open-0001");
assert.equal(exercise.name, "barbell bench press");
assert.equal(exercise.part, "胸");
assert.equal(exercise.equipment, "杠铃");
assert.match(exercise.guide, /卧推凳/);
assert.equal(exercise.steps.length, 3);
assert.equal(exercise.media.gif, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0001-demo.gif");
assert.match(exercise.source, /hasaneyldrm/);

const food = normalizeFood({
  foodCode: "091101x",
  foodName: "鸡（代表值）",
  energyKCal: "145",
  protein: "20.3",
  fat: "6.7",
  CHO: "0.9"
}, "禽肉类及其制品-鸡");

assert.equal(food.id, "food-091101x");
assert.equal(food.name, "鸡（代表值）");
assert.equal(food.calories, 145);
assert.equal(food.protein, 20.3);
assert.equal(food.fat, 6.7);
assert.equal(food.carbs, 0.9);
assert.equal(food.unit, "每100g");
assert.equal(food.category, "禽肉类及其制品-鸡");
assert.match(food.source, /中国食物成分表/);

assert.equal(normalizeFood({ foodName: "空数据" }, "测试"), null);

console.log("open data normalization checks passed");
