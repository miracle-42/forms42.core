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

import { BindValue } from "./BindValue";

export class SQLRest
{
	stmt:string = "";
	returnclause:boolean;
	bindvalues:BindValue[];

	toString() : string
	{
		let str = this.stmt;

		if (this.bindvalues != null && this.bindvalues.length > 0)
		{
			str += "[";
			for (let i = 0; i < this.bindvalues.length; i++)
			{
				if (i > 0) str += ", ";
				str += this.bindvalues[i].toString();
			}
			str += "]";
		}

		return(str);
	}
}