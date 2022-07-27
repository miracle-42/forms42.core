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

import { Record } from "../model/Record.js";
import { Block } from "./Block";
import { FieldInstance } from "./fields/FieldInstance";
import { FieldProperties } from "./fields/FieldProperties";
import { Row } from "./Row.js";

export class RecordProperties
{
	private block:Block = null;

	propmap$:Map<object,Map<string,FieldProperties>> =
		new Map<object,Map<string,FieldProperties>>();

	constructor(block:Block)
	{
		this.block = block;
	}

	public clear() : void
	{
		this.propmap$.clear();
	}

	public set(row:Row, inst:FieldInstance, record:Record, props:FieldProperties) : void
	{
		let rmap:Map<string,FieldProperties> = this.propmap$.get(record.id);

		if (rmap == null)
		{
			rmap = new Map<string,FieldProperties>();
			this.propmap$.set(record.id,rmap);
		}

		let idx:number = row.getInstanceIndex(inst);
		let field:string = idx+";"+inst.name;
		rmap.set(field,props);
		console.log("setting props, inst: "+inst.name+"["+inst.row+"] field: "+field);
	}

	public get(row:Row, inst:FieldInstance, record:Record) : FieldProperties
	{
		let props:FieldProperties = null;
		let rmap:Map<string,FieldProperties> = this.propmap$.get(record.id);

		if (rmap != null)
		{
			let idx:number = row.getInstanceIndex(inst);
			let field:string = idx+";"+inst.name;
			props = rmap.get(field);
			console.log("getting props, inst: "+inst.name+"["+inst.row+"] field: "+field+" "+props);
		}

		return(props);
	}
}