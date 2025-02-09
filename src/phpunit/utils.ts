import { Class, Declaration, Engine, Namespace } from 'php-parser';

class EscapeValue {
    private values = {
        escape: ['||', '|\'', '|n', '|r', '|]', '|['],
        unescape: ['|', '\'', '\n', '\r', ']', '['],
    };

    private patterns: { unescape: RegExp[]; escape: RegExp[] };

    constructor() {
        this.patterns = {
            escape: this.toRegExp(this.values.escape),
            unescape: this.toRegExp(this.values.unescape),
        };
    }

    public escape(value: string | number | object) {
        return this.change(value, this.patterns.unescape, this.values.escape);
    }

    public unescape(value: string | number | object) {
        return this.change(value, this.patterns.escape, this.values.unescape);
    }

    public escapeSingleQuote(value: string | number | object) {
        return this.change(value, [new RegExp('\\|\'', 'g')], ['%%%SINGLE_QUOTE%%%']);
    }

    public unescapeSingleQuote(value: string | number | object) {
        return this.change(value, [new RegExp('%%%SINGLE_QUOTE%%%', 'g')], ['\'']);
    }

    private change(value: string | number | any, from: RegExp[], to: string[]) {
        if (typeof value === 'object') {
            for (const x in value) {
                value[x] = this.change(value[x], from, to);
            }

            return value;
        }

        if (typeof value !== 'string') {
            return value;
        }

        for (const x in from) {
            value = value.replace(from[x], to[x]);
        }

        return value;
    }

    private toRegExp(values: string[]) {
        return values.map((str) => {
            str = str.replace(/([|\]\[])/g, (m) => `\\${m}`);

            return new RegExp(str, 'g');
        });
    }
}

export const EOL = '\r\n';
export const engine = new Engine({
    ast: { withPositions: true, withSource: true },
    parser: { extractDoc: true, suppressErrors: false },
    lexer: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        all_tokens: true,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        short_tags: true,
    },
});
export const getName = (ast: Namespace | Class | Declaration) => {
    return typeof ast.name === 'string' ? ast.name : ast.name.name;
};
// const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
export const escapeValue = new EscapeValue();
export const parseValue = (key: any, value: any): string[] => {
    if (value instanceof Array) {
        return value.reduce((acc: string[], item: any) => acc.concat(parseValue(key, item)), []);
    }
    const dash = key.length === 1 ? '-' : '--';
    const operator = key.length === 1 ? ' ' : '=';

    return [value === true ? `${dash}${key}` : `${dash}${key}${operator}${value}`];
};

export const camel = (str: string) => {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_m: string, chr: string) => chr.toUpperCase());
};