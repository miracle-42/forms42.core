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

export class Key
{
	private name$:string = null;
	private block$:Block = null;
	private fields$:string[] = null;


	constructor(name:string, block:Block, fields:string|string[])
	{
		name = name.toLowerCase();

		if (!Array.isArray(fields))
			fields = [fields];

		this.name$ = name;
		this.block$ = block;
		this.fields$ = fields;
	}

	public get name() : string
	{
		return(this.name$);
	}

	public get block() : Block
	{
		return(this.block$);
	}

	public get fields() : string[]
	{
		return(this.fields$);
	}
}