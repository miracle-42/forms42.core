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

import { Row } from "../view/Row.js";
import { Field } from "../view/fields/Field.js";
import { FieldProperties } from "./FieldProperties.js";
import { Block as ModelBlock } from "../model/Block.js";
import { Record as Internal, RecordState } from "../model/Record.js";

export class Record
{
	private rec$:Internal = null;

	constructor(rec:Internal)
	{
		this.rec$ = rec;
	}

	public get recno() : number
	{
		return(this.rec$.wrapper.index(this.rec$));
	}

	public get state() : RecordState
	{
		return(this.rec$.state);
	}

	public get response() : any
	{
		return(this.rec$.response);
	}

	public getValue(field:string) : any
	{
		field = field?.toLowerCase();
		let blk:ModelBlock = this.rec$.block;
		let row:Row = blk?.view.displayed(this.rec$);

		let fld:Field = row?.getField(field);

		if (fld == null && row != null)
		{
			if (blk.view.row == row.rownum)
				fld = blk.view.getRow(-1)?.getField(field);
		}

		if (fld != null)
			return(fld.getValue());

		return(this.rec$.getValue(field));
	}

	/**
	 * Make sure the datasource marks current record locked.
	 */
	public async lock() : Promise<boolean>
	{
		return(this.rec$.wrapper?.lock(this.rec$));
	}

	/**
	 * Make sure the datasource marks this record updated.
	 * @param field any non derived field
	 */
	public setDirty(field?:string) : void
	{
		this.rec$.setDirty(field);
		this.rec$.wrapper.dirty = true;
	}

	/**
	 * setAndValidate field value as if changed by a user.
	 * @param field
	 */
	 public async setAndValidate(field:string, value:any) : Promise<boolean>
	 {
		if (!await this.lock())
			return(false);

		this.setValue(field,value);
		field = field?.toLowerCase();
		let blk:ModelBlock = this.rec$.block;

		return(blk.validateField(this.rec$,field));
	 }

	/**
	 * Set the field value. This operation neither locks the record, nor marks it dirty
	 * @param field
	 * @param value
	 */
	public setValue(field:string, value:any) : void
	{
		field = field?.toLowerCase();
		this.rec$.setValue(field,value);
		let blk:ModelBlock = this.rec$.block;
		let row:Row = blk?.view.displayed(this.rec$);

		if (row != null)
		{
			let fld:Field = row.getField(field);
			if (this.rec$.dirty) row.invalidate();

			if (fld != null)
			{
				fld.setValue(value);
			}
			else
			{
				if (blk.view.row == row.rownum)
				{
					fld = blk.view.getRow(-1)?.getField(field);
					if (fld != null) fld.setValue(value);
				}
			}
		}
	}

	public getProperties(field?:string, clazz?:string) : FieldProperties
	{
		let blk:ModelBlock = this.rec$.block;
		return(new FieldProperties(blk.view.getRecordProperties(this.rec$,field,clazz)));
	}

	public setProperties(props:FieldProperties, field:string, clazz?:string) : void
	{
		field = field?.toLowerCase();
		clazz = clazz?.toLowerCase();
		let blk:ModelBlock = this.rec$.block;
		blk.view.setRecordProperties(this.rec$,field,clazz,props);
	}

	public clearProperties(field:string, clazz?:string) : void
	{
		field = field?.toLowerCase();
		clazz = clazz?.toLowerCase();
		let blk:ModelBlock = this.rec$.block;
		blk.view.setRecordProperties(this.rec$,field,clazz,null);
	}
}