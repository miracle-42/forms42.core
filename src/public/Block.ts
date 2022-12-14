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
import { Record } from './Record.js';
import { Status } from '../view/Row.js';
import { Alert } from '../application/Alert.js';
import { ListOfValues } from './ListOfValues.js';
import { DateConstraint } from './DateConstraint.js';
import { KeyMap } from '../control/events/KeyMap.js';
import { FieldProperties } from './FieldProperties.js';
import { Block as ModelBlock } from '../model/Block.js';
import { EventType } from '../control/events/EventType.js';
import { FormBacking } from '../application/FormBacking.js';
import { FilterStructure } from '../model/FilterStructure.js';
import { DataSource } from '../model/interfaces/DataSource.js';
import { FieldInstance } from '../view/fields/FieldInstance.js';
import { FieldFeatureFactory } from '../view/FieldFeatureFactory.js';
import { Record as ModelRecord, RecordState } from '../model/Record.js';

export class Block
{
	private form$:Form = null;
	private name$:string = null;

	public qbeallowed:boolean = true;
	public queryallowed:boolean = true;
	public insertallowed:boolean = true;
	public updateallowed:boolean = true;
	public deleteallowed:boolean = true;

	constructor(form:Form, name:string)
	{
		this.form$ = form;
		this.name$ = name?.toLowerCase();
		form.blocks.set(this.name$,this);
		FormBacking.getModelBlock(this,true);
	}

	public get form() : Form
	{
		return(this.form$);
	}

	public get name() : string
	{
		return(this.name$);
	}

	public get filter() : FilterStructure
	{
		return(FormBacking.getModelBlock(this).QueryFilter);
	}

	public get row() : number
	{
		return(FormBacking.getViewBlock(this).row);
	}

	public get rows() : number
	{
		return(FormBacking.getViewBlock(this).rows);
	}

	public focus() : void
	{
		FormBacking.getViewBlock(this).focus();
	}

	public get record() : number
	{
		return(FormBacking.getModelBlock(this).record);
	}

	public get state() : RecordState
	{
		return(this.getRecord()?.state);
	}

	public get fields() : string[]
	{
		let fields:Set<string> = new Set<string>();

		FormBacking.getViewBlock(this).getAllFields().
			forEach((fld) => fields.add(fld.name))

		return(Array.from(fields));
	}

	public flush() : void
	{
		FormBacking.getModelBlock(this).flush();
	}

	public async clear() : Promise<boolean>
	{
		return(FormBacking.getModelBlock(this).clear());
	}

	public insertMode() : boolean
	{
		return(this.getRecord().state == RecordState.New || this.getRecord().state == RecordState.Inserted);
	}

	public queryMode() : boolean
	{
		return(FormBacking.getModelBlock(this).querymode);
	}

	public empty() : boolean
	{
		return(FormBacking.getModelBlock(this).empty);
	}

	public refresh(offset?:number) : void
	{
		if (offset == null) offset = 0;
		FormBacking.getModelBlock(this).refresh(offset);
	}

	public getFieldNames() : string[]
	{
		return(FormBacking.getViewBlock(this).getFieldNames());
	}

	public showDatePicker(field:string) : void
	{
		field = field?.toLowerCase();
		FormBacking.getViewForm(this.form).showDatePicker(this.name,field);
	}

	public showListOfValues(field:string) : void
	{
		field = field?.toLowerCase();
		FormBacking.getViewForm(this.form).showListOfValues(this.name,field);
	}

	public async sendkey(key:KeyMap, field?:string, clazz?:string) : Promise<boolean>
	{
		return(this.form.sendkey(key,this.name,field,clazz));
	}

	public querydetails(field?:string) : void
	{
		if (!field) FormBacking.getModelBlock(this).queryDetails(true);
		else FormBacking.getModelForm(this.form).queryFieldDetails(this.name,field);
	}

	public async prevrecord() : Promise<boolean>
	{
		return(FormBacking.getViewBlock(this).prevrecord());
	}

	public async nextrecord() : Promise<boolean>
	{
		return(FormBacking.getViewBlock(this).nextrecord());
	}

	public goField(field:string, clazz?:string) : void
	{
		FormBacking.getViewBlock(this).goField(field,clazz);
	}

	public message(msg:string, title?:string) : void
	{
		Alert.message(msg,title);
	}

	public warning(msg:string, title?:string) : void
	{
		Alert.warning(msg,title);
	}

	public setListOfValues(lov:ListOfValues, field:string|string[]) : void
	{
		if (!Array.isArray(field))
			field = [field];

		for (let i = 0; i < field.length; i++)
			FormBacking.getBacking(this.form).setListOfValues(this.name,field[i],lov);
	}

	public setDateConstraint(constraint:DateConstraint, field:string|string[]) : void
	{
		if (!Array.isArray(field))
			field = [field];

		for (let i = 0; i < field.length; i++)
			FormBacking.getBacking(this.form).setDateConstraint(this.name,field[i],constraint);
	}

	public async getSourceData(header?:boolean, all?:boolean) : Promise<any[][]>
	{
		return(FormBacking.getModelBlock(this).copy(all,header));
	}

	public async saveDataToClipBoard(header?:boolean, all?:boolean) : Promise<void>
	{
		let str:string = "";
		let data:string[][] = await this.getSourceData(header,all);

		data.forEach((rec) =>
		{
			let row:string = "";
			rec.forEach((col) => {row += ", "+col})
			str += row.substring(2)+"\n";
		})

		str = str.substring(0,str.length-1);
		navigator.clipboard.writeText(str);
	}

	public get datasource() : DataSource
	{
		return(FormBacking.getModelBlock(this,true).datasource);
	}

	public set datasource(source:DataSource)
	{
		FormBacking.getModelBlock(this,true).datasource = source;
	}

	public async delete() : Promise<boolean>
	{
		return(FormBacking.getModelBlock(this)?.delete());
	}

	public async insert(before?:boolean) : Promise<boolean>
	{
		return(FormBacking.getModelBlock(this)?.insert(before));
	}

	public getValue(field:string) : any
	{
		return(this.getRecord()?.getValue(field));
	}

	public setValue(field:string, value:any) : void
	{
		this.getRecord()?.setValue(field,value);
	}

	public getCurrentField() : string
	{
		return(FormBacking.getViewBlock(this).current.name);
	}

	/**
	 * setAndValidate field value as if changed by a user.
	 * @param field
	 */
	public async setAndValidate(field:string, value:any) : Promise<boolean>
	{
		return(this.getRecord().setAndValidate(field,value));
	}

	public async lock() : Promise<void>
	{
		this.getRecord().lock();
	}

	public setDirty(field?:string) : void
	{
		this.getRecord().setDirty(field);
	}

	public getRecord(offset?:number) : Record
	{
		let intrec:ModelRecord = null;
		if (offset == null) offset = 0;

		let block:ModelBlock = FormBacking.getModelBlock(this);

		if (!FormBacking.getModelForm(this.form).hasEventTransaction(block))
		{
			intrec = block.getRecord(offset);
		}
		else
		{
			if (offset != 0)
			{
				let running:EventType = FormBacking.getModelForm(this.form).eventTransaction.getEvent(block);
				Alert.fatal("During transaction "+EventType[running]+" only current record can be accessed","Transaction Violation");
				return(null);
			}

			intrec = FormBacking.getModelForm(this.form).eventTransaction.getRecord(block);
		}

		return(intrec == null ? null : new Record(intrec));
	}

	public getQBEProperties(field:string) : FieldProperties
	{
		field = field?.toLowerCase();
		let inst:FieldInstance[] = FormBacking.getViewBlock(this).getFields(field);
		if (inst.length > 0) return(new FieldProperties(inst[0].qbeProperties));
		return(null);
	}

	public getInsertProperties(field:string) : FieldProperties
	{
		field = field?.toLowerCase();
		let inst:FieldInstance[] = FormBacking.getViewBlock(this).getFields(field);
		if (inst.length > 0) return(new FieldProperties(inst[0].insertProperties));
		return(null);
	}

	public getDefaultProperties(field:string) : FieldProperties
	{
		field = field?.toLowerCase();
		let inst:FieldInstance[] = FormBacking.getViewBlock(this).getFields(field);
		if (inst.length > 0) return(new FieldProperties(inst[0].updateProperties));
		return(null);
	}

	public getQBEPropertiesById(field:string, id:string) : FieldProperties
	{
		id = id?.toLowerCase();
		field = field?.toLowerCase();
		let inst:FieldInstance = FormBacking.getViewBlock(this).getFieldById(field,id);
		if (inst != null) return(new FieldProperties(inst.qbeProperties));
		return(null);
	}

	public getInsertPropertiesById(field:string, id:string) : FieldProperties
	{
		id = id?.toLowerCase();
		field = field?.toLowerCase();
		let inst:FieldInstance = FormBacking.getViewBlock(this).getFieldById(field,id);
		if (inst != null) return(new FieldProperties(inst.insertProperties));
		return(null);
	}

	public getDefaultPropertiesById(field:string, id:string) : FieldProperties
	{
		id = id?.toLowerCase();
		field = field?.toLowerCase();
		let inst:FieldInstance = FormBacking.getViewBlock(this).getFieldById(field,id);
		if (inst != null) return(new FieldProperties(inst.updateProperties));
		return(null);
	}

	public getQBEPropertiesByClass(field:string, clazz?:string) : FieldProperties
	{
		let props:FieldProperties[] = this.getAllQBEPropertiesByClass(field,clazz);
		return(props.length == 0 ? null : props[0])
	}

	public getInsertPropertiesByClass(field:string, clazz?:string) : FieldProperties
	{
		let props:FieldProperties[] = this.getAllInsertPropertiesByClass(field,clazz);
		return(props.length == 0 ? null : props[0])
	}

	public getDefaultPropertiesByClass(field:string, clazz?:string) : FieldProperties
	{
		let props:FieldProperties[] = this.getAllDefaultPropertiesByClass(field,clazz);
		return(props.length == 0 ? null : props[0])
	}

	public getAllQBEPropertiesByClass(field:string, clazz?:string) : FieldProperties[]
	{
		clazz = clazz?.toLowerCase();
		field = field?.toLowerCase();
		let props:FieldProperties[] = [];
		FormBacking.getViewBlock(this).getFieldsByClass(field,clazz).
		forEach((inst) => {props.push(new FieldProperties(inst.qbeProperties))})
		return(props);
	}

	public getAllInsertPropertiesByClass(field:string, clazz?:string) : FieldProperties[]
	{
		clazz = clazz?.toLowerCase();
		field = field?.toLowerCase();
		let props:FieldProperties[] = [];
		FormBacking.getViewBlock(this).getFieldsByClass(field,clazz).
		forEach((inst) => {props.push(new FieldProperties(inst.insertProperties))})
		return(props);
	}

	public getAllDefaultPropertiesByClass(field:string, clazz?:string) : FieldProperties[]
	{
		clazz = clazz?.toLowerCase();
		field = field?.toLowerCase();
		let props:FieldProperties[] = [];
		FormBacking.getViewBlock(this).getFieldsByClass(field,clazz).
		forEach((inst) => {props.push(new FieldProperties(inst.updateProperties))})
		return(props);
	}

	public setQBEProperties(props:FieldProperties, field:string, clazz?:string) : void
	{
		field = field?.toLowerCase();
		clazz = clazz?.toLowerCase();
		FormBacking.getViewBlock(this).getFieldsByClass(field,clazz).
		forEach((inst) => {FieldFeatureFactory.replace(props,inst,Status.qbe);})
	}

	public setInsertProperties(props:FieldProperties, field:string, clazz?:string) : void
	{
		field = field?.toLowerCase();
		clazz = clazz?.toLowerCase();
		FormBacking.getViewBlock(this).getFieldsByClass(field,clazz).
		forEach((inst) => {FieldFeatureFactory.replace(props,inst,Status.insert);})
	}

	public setDefaultProperties(props:FieldProperties, field:string, clazz?:string) : void
	{
		field = field?.toLowerCase();
		clazz = clazz?.toLowerCase();
		FormBacking.getViewBlock(this).getFieldsByClass(field,clazz).
		forEach((inst) => {FieldFeatureFactory.replace(props,inst,Status.update);})
	}

	public setQBEPropertiesById(props:FieldProperties, field:string, id:string) : void
	{
		id = id?.toLowerCase();
		field = field?.toLowerCase();
		let inst:FieldInstance = FormBacking.getViewBlock(this).getFieldById(field,id);
		FieldFeatureFactory.replace(props,inst,Status.qbe);
	}

	public setInsertPropertiesById(props:FieldProperties, field:string, id:string) : void
	{
		id = id?.toLowerCase();
		field = field?.toLowerCase();
		let inst:FieldInstance = FormBacking.getViewBlock(this).getFieldById(field,id);
		FieldFeatureFactory.replace(props,inst,Status.insert);
	}

	public setDefaultPropertiesById(props:FieldProperties, field:string, id:string) : void
	{
		id = id?.toLowerCase();
		field = field?.toLowerCase();
		let inst:FieldInstance = FormBacking.getViewBlock(this).getFieldById(field,id);
		FieldFeatureFactory.replace(props,inst,Status.update);
	}

	public async reQuery() : Promise<boolean>
	{
		return(FormBacking.getModelForm(this.form).executeQuery(this.name,true));
	}

	public async enterQueryMode() : Promise<boolean>
	{
		return(FormBacking.getModelForm(this.form).enterQuery(this.name));
	}

	public async executeQuery() : Promise<boolean>
	{
		return(FormBacking.getModelForm(this.form).executeQuery(this.name,false));
	}
}