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

import { Block } from "../Block.js";
import { Alert } from "../../application/Alert.js";

export class Key
{
	private name$:string = null;
	private block$:string = null;
	private fields$:string[] = null;


	constructor(block:string|Block, fields:string|string[])
	{
		if (block == null)
		{
			Alert.fatal("Invalid key definition, block: 'null'","Key");
			return;
		}

		if (fields == null)
		{
			Alert.fatal("Invalid key definition, fields: 'null'","Key");
			return;
		}

		if (!Array.isArray(fields))
			fields = [fields];

		if (fields.length == 0)
		{
			Alert.fatal("Invalid key definition, no fields","Key");
			return;
		}

		if (typeof block != "string")
			block = block.name;

		this.block$ = block.toLowerCase();

		this.fields$ = fields;

		for (let i = 0; i < fields.length; i++)
			fields[i] = fields[i].toLowerCase();
	}

	public get name() : string
	{
		return(this.name$);
	}

	public get block() : string
	{
		return(this.block$);
	}

	public get fields() : string[]
	{
		return(this.fields$);
	}
}