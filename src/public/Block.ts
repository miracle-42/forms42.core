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
import { Field } from './Field.js';
import { Record } from './Record.js';
import { Status } from '../view/Row.js';
import { Alert } from '../application/Alert.js';
import { Form as ModelForm } from '../model/Form.js';
import { FieldProperties } from './FieldProperties.js';
import { Block as ViewBlock } from '../view/Block.js';
import { Block as ModelBlock } from '../model/Block.js';
import { Record as ModelRecord } from '../model/Record.js';
import { DataSource } from '../model/interfaces/DataSource.js';

export class Block
{
	private form$:Form = null;
	private name$:string = null;

	constructor(form:Form, name:string)
	{
		this.form$ = form;
		if (name == null) name = "";
		this.name$ = name.toLowerCase();
		ModelBlock.create(ModelForm.getForm(form),this);
	}

	public get form() : Form
	{
		return(this.form$);
	}

	public get name() : string
	{
		return(this.name$);
	}

	public set datasource(source:DataSource)
	{
		ModelBlock.getBlock(this).datasource = source;
	}

	public getValue(field:string, dirty?:boolean) : any
	{
		return(this.getRecord(0)?.getValue(field,dirty));
	}

	public setValue(field:string, value:any) : void
	{
		this.getRecord(0)?.setValue(field,value);
	}

	public getRecord(offset?:number) : Record
	{
		let intrec:ModelRecord = null;
		if (offset == null) offset = 0;
		let block:ModelBlock = ModelBlock.getBlock(this);

		if (!block.eventTransaction.active)
		{
			intrec = block.getRecord(offset);
		}
		else
		{
			intrec = block.eventTransaction.getTrxRecord(this.name);

			if (intrec != null && offset != 0)
			{
				Alert.fatal("Only current record can be accessed when block is in transaction","Transaction Violation");
				return(null);
			}
		}

		return(intrec == null ? null : new Record(intrec));
	}

	public addKey(name:string, fields:string|string[]) : void
	{
		if (name == null) throw "@Block: Key name is madatory";
		if (fields == null) throw "@Block: Key fields is madatory";
		ModelBlock.getBlock(this).addKey(name,fields);
	}

	public removeKey(name:string) : boolean
	{
		return(ModelBlock.getBlock(this).removeKey(name));
	}

	public getFieldById(field:string, id:string) : Field
	{
		return(this.form.getFieldById(this.name,field,id));
	}

	public getFields(field:string, clazz?:string) : Field[]
	{
		return(this.form.getFields(this.name,field,clazz));
	}

	public getQBEProperties(field:string, clazz?:string) : FieldProperties[]
	{
		field = field?.toLowerCase();
		let props:FieldProperties[] = [];

		ViewBlock.getBlock(this).getAllFields(field).forEach((vfld) =>
		{
			vfld.getInstancesByClass(clazz).forEach((inst) =>
			{
				props.push(new FieldProperties(inst,true,Status.qbe));
			})
		})

		return(props);
	}

	public getDefaultProperties(field:string, clazz?:string) : FieldProperties[]
	{
		field = field?.toLowerCase();
		let props:FieldProperties[] = [];

		ViewBlock.getBlock(this).getAllFields(field).forEach((vfld) =>
		{
			vfld.getInstancesByClass(clazz).forEach((inst) =>
			{
				props.push(new FieldProperties(inst,true,Status.update));
			})
		})

		return(props);
	}

	public getInsertProperties(field:string, clazz?:string) : FieldProperties[]
	{
		field = field?.toLowerCase();
		let props:FieldProperties[] = [];

		ViewBlock.getBlock(this).getAllFields(field).forEach((vfld) =>
		{
			vfld.getInstancesByClass(clazz).forEach((inst) =>
			{
				props.push(new FieldProperties(inst,true,Status.insert));
			})
		})

		return(props);
	}

	public async executeQuery() : Promise<boolean>
	{
		return(ModelBlock.getBlock(this).executeQuery());
	}
}