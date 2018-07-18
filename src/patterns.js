export const valuePattern = /---!{.*?(}!---)/gi;
export const eventPattern = /^\(.*\)$/gi;
export const propPattern = /^\[.*\]$/;
export const sanitizePattern = /^this\./;
export const startSeparator = /---!\{/gi;
export const endSeparator = /\}!---/gi;
export const modelPattern = /t-model/gi;
export const modelNamesPattern = /t-model=?".*?"/gi;
export const modelSymbol = Symbol('t-model');
export const removeSymbol = Symbol('RemoveTemplate');

export const valueToInt = match => +match.replace(/(---!{)|(}!---)/gi, '');
export const toEventName = match => match.replace(/(\()|(\))/gi, '');
