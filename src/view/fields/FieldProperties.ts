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

import { FieldInstance } from "./FieldInstance.js";
import { BasicProperties } from "./BasicProperties.js";
import { Block as ModelBlock } from "../../model/Block.js";


export class FieldProperties extends BasicProperties
{
	private row$:number = -1;
	private id$:string = null;
	private name$:string = null;
	private block$:string = null;
	private inst$:FieldInstance = null;

	public get id() : string
	{
		return(this.id$);
	}

	public set id(id:string)
	{
		this.id$ = null;

		if (id != null)
		{
			this.id$ = id.trim().toLowerCase();
			if (this.id$.length == 0) this.id$ = null;
		}
	}

	public get type() : string
	{
		return(this.inst$.element.getAttribute("type"));
	}

	public get name() : string
	{
		return(this.name$);
	}

	public set name(name:string)
	{
		this.name$ = null;

		if (name != null)
		{
			this.name$ = name.trim().toLowerCase();
			if (this.name$.length == 0) this.name$ = null;
		}
	}

	public get block() : string
	{
		return(this.block$);
	}

	public set block(block:string)
	{
		this.block$ = null;

		if (block != null)
		{
			this.block$ = block.trim().toLowerCase();
			if (this.block$.length == 0) this.block$ = null;
		}
	}

	public get row() : number
	{
		return(this.row$);
	}

	public set row(row:number)
	{
		if (row < 0) this.row$ = -1;
		else		 this.row$ = row;
	}

	public get inst() : FieldInstance
	{
		return(this.inst$);
	}

	public set inst(inst:FieldInstance)
	{
		this.inst$ = inst;
	}
}
