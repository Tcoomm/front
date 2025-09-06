const OPS: Record<string, (a: number, b: number) => number> =
{
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => { if (b === 0) throw new Error('Деление на ноль.'); return a / b; }
};

function normalize(s: string): string { //меняет символы на ACKII и убирает лишние пробелы(оставшиеся станут токенами)
    return s
        .replace(/[×]/g, '*').replace(/[÷]/g, '/').replace(/[−]/g, '-')
        .replace(/([\(\)])/g, ' $1 ').replace(/\s+/g, ' ').trim();
}
function tokenize(s: string): string[] { return normalize(s).split(' ').filter(Boolean); } //превращает выражение в список токенов
function isNum(t: string): boolean { return /^[-+]?\d+(\.\d+)?$/.test(t); } //проверяет является ли числом в нужном формате(знак+число+символы после запятой)

type R = { value: number; next: number };

function parse(tokens: string[], i: number): R {
    if (i >= tokens.length) throw new Error('Неожиданный конец выражения.');
    const t = tokens[i];

    if (t === '(') {
        const inner = parse(tokens, i + 1);
        if (inner.next >= tokens.length || tokens[inner.next] !== ')') throw new Error('Ожидалась ).');
        return { value: inner.value, next: inner.next + 1 };
    }
    if (isNum(t)) return { value: parseFloat(t), next: i + 1 };

    if (t in OPS) {
        const L = parse(tokens, i + 1);
        const Rr = parse(tokens, L.next);
        return { value: OPS[t](L.value, Rr.value), next: Rr.next };
    }
    if (t === ')') throw new Error('Неожиданная ).');
    throw new Error(`Неизвестный токен: "${t}"`);
}

function calc(expr: string): number {
    try {
        const tokens = tokenize(expr);
        const { value, next } = parse(tokens, 0);
        if (next !== tokens.length) throw new Error('Лишние токены в конце.');
        console.log(String(value));
        return value;
    } catch (e: any) {
        console.error('Неправильное выражение:', e.message);
        return 0;
    }
}


console.log("=== Тестирование калькулятора ===");
calc("+ 3     4");
calc("*( - 5 6 ) 7");
calc("+ ( + 5 * 2 3) 4");
calc("(/ ( - 10 4 ) 2)");
calc("+ ( + 1 2 ) ( + 3 4 )");
calc("+ - + - 1 11 45 75 41");
calc("/ 1 0");
calc("+ 3");
calc("+ a 4");
calc("/ 10 0");
calc("( + 1 2");
calc("1 2 3");
calc("");
calc("()");
