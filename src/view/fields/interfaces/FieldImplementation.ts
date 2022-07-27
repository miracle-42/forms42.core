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

import { FieldProperties } from "../FieldProperties.js";
import { FieldEventHandler } from "./FieldEventHandler.js";

export enum FieldState
{
	OPEN,
	READONLY,
	DISABLED
}

export interface FieldImplementation
{
	apply(properties:FieldProperties, init:boolean) : void
	create(eventhandler:FieldEventHandler, tag:string) : HTMLElement;

	clear() : void;
	getValue() : any;
    setValue(value:any) : boolean;

	getIntermediateValue() : string;
	setIntermediateValue(value:string) : void;

	getFieldState() : FieldState;
	setFieldState(state:FieldState) : void;

    getElement() : HTMLElement;
}
