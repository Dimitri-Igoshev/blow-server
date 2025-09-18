type Sex = 'FEMALE' | 'MALE';

interface BodySample {
  heightCm: number; // целое
  weightKg: number; // целое
}

/** Случайное целое [min, max] включительно */
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
/** Случайное число с плавающей точкой [min, max) */
function randFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/**
 * Генерация роста и веса по полу.
 * Рост — равномерно из диапазона по полу.
 * Вес — через BMI: weight = BMI * (height_m)^2
 */
export function randomBody(sex: Sex): BodySample {
  const heightRange: [number, number] =
    sex === 'FEMALE' ? [158, 175] : [172, 195]; // см

  const bmiRange: [number, number] = sex === 'FEMALE' ? [19, 24] : [20, 26]; // реалистичный коридор BMI

  const heightCm = randInt(heightRange[0], heightRange[1]);
  const heightM = heightCm / 100;
  const bmi = randFloat(bmiRange[0], bmiRange[1]);

  const weightKg = Math.round(bmi * heightM * heightM);

  return { heightCm, weightKg };
}
