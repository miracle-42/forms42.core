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
import { StoredProcedure } from "./StoredProcedure.js";
import { DatabaseConnection } from "../public/DatabaseConnection.js";

export class StoredFunction extends StoredProcedure
{
	public constructor(connection:DatabaseConnection)
	{
		super(connection);
		super.returntype$ = "string";
	}

	public getReturnValue()
	{
		return(super.getOutParameter(this.retparm$));
	}

	public setReturnType(datatype?:DataType|string) : void
	{
		super.returntype$ = datatype;
	}
}