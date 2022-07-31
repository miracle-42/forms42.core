/*
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3 only, as
 * published by the Free Software Foundation.

 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 */

export enum Validity
{
    na,
    true,
    false,
    asupper,
    aslower
}

export interface Pattern
{
    size() : number;
    isNull() : boolean;

    getPattern() : string;
    setPattern(pattern:string) : void;

    getValue() : string;
    setValue(value:any) : boolean;

	isValid(pos:number, c:string) : boolean
    validity(pos:number, c:string) : Validity

    prev(printable:boolean,from?:number) : number;
    next(printable:boolean,from?:number) : number;

    getPosition() : number;
    getFields() : Section[];
    getField(n:number) : Section;
    input(pos:number) : boolean;
    findField(pos?:number) : Section;
    findPosition(pos:number) : number;
    setPosition(pos:number) : boolean;
    getFieldArea(pos:number) : number[];
    delete(fr:number,to:number) : string;
    setCharacter(pos:number, c:string) : boolean;
}

export interface Section
{
    pos() : number;
    size() : number;
    field() : number;
    isNull() : boolean;
    getValue() : string;
    setValue(value:string) : void;
}