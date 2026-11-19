// Telefone no padrão brasileiro: DDD + número (10 dígitos fixo, 11 celular).
// A mesma regra está em server/src/lib/schemas.ts (o servidor é quem garante);
// aqui ela só avisa antes de enviar. Altere as duas juntas.

const VALID_DDDS = new Set([
    11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28,
    31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79,
    81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

function isObviousSequence(digits) {
    if (/^(\d)\1+$/.test(digits)) return true;
    const steps = new Set();
    for (let i = 1; i < digits.length; i++) steps.add((Number(digits[i]) - Number(digits[i - 1]) + 10) % 10);
    return steps.size === 1 && (steps.has(1) || steps.has(9));
}

/** Só os dígitos, sem o +55 do Brasil. */
export function phoneDigits(value) {
    const raw = String(value || "").trim();
    let digits = raw.replace(/\D/g, "");
    if ((raw.startsWith("+") || digits.length > 11) && digits.startsWith("55")) digits = digits.slice(2);
    return digits;
}

/** Mensagem de erro, ou null se o telefone for válido (ou estiver vazio). */
export function phoneProblem(value) {
    if (!String(value || "").trim()) return null;
    const digits = phoneDigits(value);
    if (digits.length !== 10 && digits.length !== 11) {
        return "O telefone deve ter DDD + número: 10 dígitos (fixo) ou 11 (celular).";
    }
    if (!VALID_DDDS.has(Number(digits.slice(0, 2)))) return "Esse DDD não existe.";
    const local = digits.slice(2);
    if (digits.length === 11 && local[0] !== "9") return "Celular deve começar com 9 depois do DDD.";
    if (digits.length === 10 && !/^[2-5]/.test(local)) return "Telefone fixo deve começar com 2, 3, 4 ou 5 depois do DDD.";
    const subscriber = digits.length === 11 ? local.slice(1) : local;
    if (isObviousSequence(subscriber)) return "Informe um telefone válido.";
    return null;
}

/** (11) 98765-4321 / (11) 3456-7890; formata também enquanto a pessoa digita. */
export function formatPhone(value) {
    const d = phoneDigits(value).slice(0, 11);
    if (!d) return "";
    if (d.length <= 2) return `(${d}`;
    const ddd = `(${d.slice(0, 2)}) `;
    const rest = d.slice(2);
    if (rest.length <= 4) return ddd + rest;
    const split = d.length === 11 ? 5 : 4;
    return `${ddd}${rest.slice(0, split)}-${rest.slice(split)}`;
}

/**
 * Aplica a máscara num campo e avisa o navegador quando o número é inválido
 * (o próprio formulário passa a bloquear o envio com a mensagem).
 */
export function bindPhoneInput(input) {
    if (!input) return;
    // Folga para colar "+55 (11) 98765-4321"; a máscara reduz para 15.
    input.maxLength = 20;
    input.inputMode = "tel";
    const check = () => input.setCustomValidity(phoneProblem(input.value) || "");
    if (input.value && !phoneProblem(input.value)) input.value = formatPhone(input.value);
    input.addEventListener("input", () => {
        // Mantém o cursor depois do mesmo dígito em que estava.
        const digitsBefore = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, "").length;
        const formatted = formatPhone(input.value);
        if (formatted !== input.value) {
            input.value = formatted;
            let pos = 0;
            for (let seen = 0; pos < formatted.length && seen < digitsBefore; pos++) {
                if (/\d/.test(formatted[pos])) seen++;
            }
            input.setSelectionRange(pos, pos);
        }
        // A mensagem só aparece quando a pessoa tenta enviar.
        check();
    });
    check();
}
