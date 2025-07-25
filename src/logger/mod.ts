/**
 * Aggregates and re-exports all core components related to logger functionality.
 *
 * @remarks
 * This module provides a convenient entry point for accessing the `Base` logger
 * class, the `Indent` logger (which adds indentation capabilities), and all
 * relevant interfaces and types that define the logger's contract.
 *
 * @module
 */
import { Base } from './base.ts';
import { Indent } from './indent.ts';
import type { FactoryMethod, IEmitter, IGetChildParams, IIndent, IInherit, ILevels, IMark } from './types.ts';
import { isIMark } from './types.ts';
import type { IBasic as MsgBuilderIBasic } from '../message/types.ts';

export const Logger = {
  Base: Base,
  Indent: Indent,
  isIMark: isIMark,
};
export interface Logger<M extends MsgBuilderIBasic, L extends IEmitter> {
  IInherit: IInherit;
  IEmitter: IEmitter;
  IIndent: IIndent;
  IMark: IMark;
  IGetChildParams: IGetChildParams;
  ILevels: ILevels;
  FactoryMethod: FactoryMethod<M, L>;
}
