

/** 字面量和字符串联合类型用于智能提示 ,提示字符串 不是类型安全的！ */
declare type HintedString<KnownValues extends string> = (string & {}) | KnownValues;

/** URLString 仅限"http" | "https" 开头字符串*/
declare type URLString = `${"http" | "https"}://${string & { length: 1 }}`;

/** NotBasicOrLiteral  排除基本类型 仅限对象类型*/
declare type NotBasicOrLiteral<T> = T extends string | number | boolean | bigint | symbol | undefined | null ? T extends T ? never : T : T;
