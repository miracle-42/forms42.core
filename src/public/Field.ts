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

import { Form } from './Form.js';
import { Status } from '../view/Row.js';
import { FieldProperties } from './FieldProperties.js';
import { FieldInstance as ViewInstance } from '../view/fields/FieldInstance.js';

export class Field
{
	constructor(private inst$:ViewInstance) {}

	public get id() : string
	{
		return(this.inst$.id);
	}

	public get name() : string
	{
		return(this.inst$.name);
	}

	public get block() : string
	{
		return(this.inst$.block);
	}

	public get row() : number
	{
		if (this.inst$.row < 0) return(null);
		else 					return(this.inst$.row);
	}

	public get form() : Form
	{
		return(this.inst$.form);
	}

	public getQBEProperties() : FieldProperties
	{
		return(new FieldProperties(this.inst$,true,Status.qbe));
	}

	public getInsertProperties() : FieldProperties
	{
		return(new FieldProperties(this.inst$,true,Status.insert));
	}

	public getDefaultProperties() : FieldProperties
	{
		return(new FieldProperties(this.inst$,true,Status.update));
	}
}