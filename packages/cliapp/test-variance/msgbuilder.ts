/**
 * Simulates @epdoc/msgbuilder package
 */

export abstract class AbstractMsgBuilder {
  text(s: string): this { return this; }
}

export class ConsoleMsgBuilder extends AbstractMsgBuilder {}

// Console.Builder is re-exported (alias) - this is how real package does it
export namespace Console {
  export const Builder = ConsoleMsgBuilder;
  export type Builder = ConsoleMsgBuilder;
}
