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

import { DataType } from "./DataType.js";

export enum ParameterType
{
	in,
	out,
	inout
}

export class Parameter
{
	value:any;
	name:string;
	dtype:string;
	ptype:ParameterType;

	constructor(name:string, value:any, dtype?:DataType|string, ptype?:ParameterType)
	{
		if (typeof dtype != "string")
			dtype = DataType[dtype];

		if (value instanceof Date)
		{
			value = value.getTime();
			if (!dtype) dtype = "date";
		}

		if (dtype == null)
		{
			dtype = "string";

			if (typeof value === "number")
				dtype = "numeric";
		}

		if (ptype == null)
			ptype = ParameterType.in;

		this.name = name;
		this.value = value;

		this.dtype = dtype;
		this.ptype = ptype;
	}
}