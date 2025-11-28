// Операторы
const BINARY_OPERATIONS: Record<string, (a: number, b: number) => number> = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => {
    if (b === 0) throw new Error("Деление на ноль.");
    return a / b;
  },
};

const UNARY_OPERATIONS: Record<string, (x: number) => number> = {
  "+": (x) => +x, // унарный плюс — тождественное преобразование
  "-": (x) => -x, // унарный минус — смена знака
};

// Нормализация строки
function normalizeString(input: string): string {
  return input
    .replace(/[×]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[−]/g, "-")
    .replace(/[()]/g, (m) => ` ${m} `)
    .replace(/\s+/g, " ")
    .trim();
}

// Токенизация
function tokenizeInput(input: string): string[] {
  return normalizeString(input).split(" ").filter(Boolean);
}

// Проверка числа
function isNumeric(token: string): boolean {
  // максимально простая и надёжная проверка
  return token !== "" && !Number.isNaN(Number(token));
}

// Парсинг числа
function parseNumberStrict(token: string): number {
  const number = Number(token);
  if (Number.isNaN(number)) throw new Error(`Ожидалось число, получено "${token}"`);
  return number;
}

// Результат рекурсивного разбора
type ParseResult = { value: number; nextIndex: number };

// Рекурсивный разбор выражения в префиксной форме
function parseExpression(tokens: string[], startIndex: number): ParseResult {
  if (startIndex >= tokens.length) throw new Error("Неожиданный конец выражения.");
  const token = tokens[startIndex];

  // Группа в скобках
  if (token === "(") {
    const inner = parseExpression(tokens, startIndex + 1);
    if (inner.nextIndex >= tokens.length || tokens[inner.nextIndex] !== ")") {
      throw new Error("Ожидалась закрывающая скобка ).");
    }
    return { value: inner.value, nextIndex: inner.nextIndex + 1 };
  }

  // Число
  if (isNumeric(token)) {
    return { value: parseNumberStrict(token), nextIndex: startIndex + 1 };
  }

  // Оператор
  if (token in BINARY_OPERATIONS || token in UNARY_OPERATIONS) {
    // Всегда сначала парсим первый операнд
    const left = parseExpression(tokens, startIndex + 1);

    // Решаем: унарный или бинарный.
    // Условие "унарности": после первого операнда либо конец ввода,
    // либо следующая лексема — закрывающая скобка ')'.
    const isUnary =
      !(token in BINARY_OPERATIONS) || // оператор вообще только унарный (на будущее)
      left.nextIndex >= tokens.length ||
      tokens[left.nextIndex] === ")";

    if (isUnary) {
      // унарная форма — применяем UNARY_OPS
      const op = UNARY_OPERATIONS[token];
      if (!op) throw new Error(`Оператор "${token}" не поддерживает унарную форму.`);
      return { value: op(left.value), nextIndex: left.nextIndex };
    }

    // бинарная форма — парсим второй операнд и применяем BINARY_OPS
    const right = parseExpression(tokens, left.nextIndex);
    const op = BINARY_OPERATIONS[token];
    if (!op) throw new Error(`Оператор "${token}" не поддерживает бинарную форму.`);
    return { value: op(left.value, right.value), nextIndex: right.nextIndex };
  }

  if (token === ")") throw new Error("Неожиданная ).");
  throw new Error(`Неизвестный токен: "${token}"`);
}

// Публичная функция
export function calc(expr: string): number {
  try {
    const tokens = tokenizeInput(expr);
    const { value, nextIndex } = parseExpression(tokens, 0);
    if (nextIndex !== tokens.length) throw new Error("Лишние токены в конце.");
    console.log(String(value));
    return value;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Неправильное выражение:", msg);
    return NaN;
  }
}

// ==== прогоны ====
console.log("=== Тестирование калькулятора ===");
// бинарные примеры
calc("- * / 15 - 7 + 1 1 3 + 2 + 1 1");
calc("+ ( + 5 * 2 3) 4");
calc("(/ ( - 10 4 ) 2)");
calc("+ ( + 1 2 ) ( + 3 4 )");
calc("+ - + - 1 11 45 75 41");
// деление на ноль
calc("/ 1 0");
// ошибки
calc("+ 3");
calc("+ a 4");
calc("/ 10 0");
calc("( + 1 2");
calc("1 2 3");
calc("");
calc("()");
// унарные примеры
calc("- 5"); // унарный минус → -5
calc("+ 7"); // унарный плюс  → 7
calc("( - ( + 3 ) )"); // вложенные унарные
