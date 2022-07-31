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

import { Form } from "./Form.js";
import { Row, Status } from "./Row.js";
import { Field } from "./fields/Field.js";
import { Record } from "../model/Record.js";
import { KeyMap } from "../control/events/KeyMap.js";
import { Form as ModelForm } from '../model/Form.js';
import { Block as ModelBlock } from '../model/Block.js';
import { RecordProperties } from "./RecordProperties.js";
import { MouseMap } from "../control/events/MouseMap.js";
import { FieldInstance } from "./fields/FieldInstance.js";
import { Form as InterfaceForm } from '../public/Form.js';
import { EventType } from "../control/events/EventType.js";
import { Block as InterfaceBlock } from '../public/Block.js';
import { FieldProperties } from "./fields/FieldProperties.js";
import { FieldState } from "./fields/interfaces/FieldImplementation.js";
import { FormEvent, FormEvents } from "../control/events/FormEvents.js";


export class Block
{
	private rc$:number = -1;
	private row$:number = -1;
	private form$:Form = null;
	private name$:string = null;
	private model$:ModelBlock = null;
	private fieldnames$:string[] = null;
	private volatile$:FieldInstance = null;
	private rows$:Map<number,Row> = new Map<number,Row>();
	private displayed$:Map<object,Row> = new Map<object,Row>();
	private recprops$:RecordProperties = new RecordProperties(this);

	public static getBlock(block:InterfaceBlock) : Block
	{
		return(Form.getForm(block.form).getBlock(block.name));
	}

	constructor(form:InterfaceForm,name:string)
	{
		this.name$ = name;
		this.fieldnames$ = [];
		this.form$ = Form.getForm(form);
		ModelBlock.create(Form.getForm(form),this);
	}

	public get row() : number
	{
		if (this.row$ < 0) return(0);
		else               return(this.row$);
	}

	public get rows() : number
	{
		return(this.rc$);
	}

	public get name() : string
	{
		return(this.name$);
	}

	public get form() : Form
	{
		return(this.form$);
	}

	public get model() : ModelBlock
	{
		return(this.model$);
	}

	public focus() : void
	{
		this.getRow(0)?.getFirstInstance()?.focus();
	}

	public getVolatileInstance() : FieldInstance
	{
		return(this.volatile$);
	}

	public getField(field:string) : Field
	{
		let fld:Field = this.getRow(this.row)?.getField(field);
		if (fld == null) fld = this.getRow(-1)?.getField(field);
		return(fld);
	}

	public getAllFields(field?:string) : Field[]
	{
		let fields:Field[] = [];
		let current:Row = this.getRow(-1);

		if (field == null)
		{
			if (current != null)
				fields.push(...current.getFields());

			for (let i = 0; i < this.rows; i++)
				fields.push(...this.getRow(i).getFields());
		}
		else
		{
			if (current != null)
			{
				let fld:Field = current.getField(field);
				if (fld != null) fields.push(fld);
			}

			for (let i = 0; i < this.rows; i++)
			{
				let fld:Field = current.getField(field);
				if (fld != null) fields.push(fld);
			}
		}

		return(fields);
	}

	public getFields(name?:string) : Field[]
	{
		let row:Row = null;
		let fields:Field[] = [];

		if (this.model.empty)
			return(fields);

		row = this.getRow(this.row);
		if (row != null) fields.push(...row.getFields());

		row = this.getRow(-1);
		if (row != null) fields.push(...row.getFields());

		if (name != null)
		{
			let named:Field[] = [];
			name = name.toLowerCase();

			fields.forEach((fld) =>
			{
				if (fld.name == name)
					named.push(fld);
			})

			fields = named;
		}

		return(fields);
	}

	public getFieldInstances() : FieldInstance[]
	{
		let row:Row = null;
		let instances:FieldInstance[] = [];

		row = this.getRow(this.row);
		if (row != null) instances.push(...row.getFieldInstances());

		row = this.getRow(-1);
		if (row != null) instances.push(...row.getFieldInstances());

		return(instances);
	}

	public getValue(field:string) : any
	{
		return(this.rows$.get(this.row).getField(field)?.getValue());
	}

	public getFieldNames() : string[]
	{
		return(this.fieldnames$);
	}

	public setRecordProperties(record:Record, inst:FieldInstance, props:FieldProperties) : void
	{
		if (record == null) record = this.model.getRecord(0);
		let row:Row = this.getRow(inst.row);
		this.recprops$.set(row,inst,record,props);
	}

	public async setEventTransaction(event:EventType, offset:number) : Promise<void>
	{
		await this.model.setEventTransaction(event,offset);
	}

	public endEventTransaction(event:EventType, apply:boolean) : void
	{
		this.model.endEventTransaction(event,apply);
	}

	public async validate(inst?:FieldInstance, value?:any) : Promise<boolean>
	{
		if (inst == null)
		{
			return(this.getRow(this.row).validate());
		}
		else
		{
			await this.setEventTransaction(EventType.WhenValidateField,0);
			let success:boolean = await this.fireFieldEvent(EventType.WhenValidateField,inst);
			this.endEventTransaction(EventType.WhenValidateField,success);

			if (success)
				this.model$.setValue(inst.name,value);

			return(success);
		}
	}

	public get validated() : boolean
	{
		return(this.getRow(this.row).validated);
	}

	public clear(props:boolean) : boolean
	{
		if (!this.validated)
			return(false);

		this.displayed$.clear();
		if (props) this.recprops$.clear();
		this.rows$.forEach((row) => {row.clear()});

		return(true);
	}

	public addInstance(inst:FieldInstance) : void
	{
		if (this.fieldnames$.indexOf(inst.name) < 0)
			this.fieldnames$.push(inst.name);
	}

	public async onKey(inst:FieldInstance, key:KeyMap) : Promise<boolean>
	{
		if (key == null) return(true);
		return(this.fireKeyEvent(inst,key));
	}

	public async onMouse(inst:FieldInstance, mevent:MouseMap) : Promise<boolean>
	{
		return(this.fireMouseEvent(inst,mevent));
	}

	public async onTyping(inst:FieldInstance) : Promise<boolean>
	{
		this.volatile$ = inst;
		await this.setEventTransaction(EventType.OnTyping,0);
		let success:boolean = await	this.fireFieldEvent(EventType.OnTyping,inst);
		this.endEventTransaction(EventType.OnTyping,success);
		this.volatile$ = null;
		return(success);
	}

	public async navigate(key:KeyMap, inst:FieldInstance) : Promise<FieldInstance>
	{
		let next:FieldInstance = inst;

		switch(key)
		{
			case KeyMap.nextfield :
			{
				next = inst.field.row.nextField(inst)
				break;
			}

			case KeyMap.prevfield :
			{
				next = inst.field.row.prevField(inst)
				break;
			}

			case KeyMap.nextrecord :
			{
				next = await this.scroll(inst,1);
				break;
			}

			case KeyMap.prevrecord :
			{
				next = await this.scroll(inst,-1);
				break;
			}

			case KeyMap.pageup :
			{
				next = await this.scroll(inst,-this.rows);
				break;
			}

			case KeyMap.pagedown :
			{
				next = await this.scroll(inst,this.rows);
				break;
			}
		}

		if (next != inst)
			inst.blur();

		next.focus();
		return(next);
	}

	public offset(inst:FieldInstance) : number
	{
		let row:number = inst.row;
		if (row < 0) row = this.row;
		return(row-this.row$);
	}

	public getCurrentRow() : Row
	{
		return(this.rows$.get(this.row));
	}

	public setCurrentRow(rownum:number) : void
	{
		if (this.row$ < 0)
		{
			this.row$ = 0;

			if (rownum > 0)
				this.row$ = rownum;

			if (this.getRow(this.row).status != Status.na)
			{
				this.openrow();
				this.displaycurrent();
				this.model.queryDetails();
			}

			this.setIndicators(null,rownum);

			return;
		}

		if (rownum == this.row || rownum == -1)
			return;

		this.model$.move(rownum-this.row);

		this.setIndicators(this.row$,rownum);
		this.getRow(this.row).setFieldState(FieldState.READONLY);

		this.row$ = rownum;

		if (this.getRow(this.row).status != Status.na)
		{
			this.openrow();
			this.model.queryDetails();
		}

		this.displaycurrent();
	}

	public addRow(row:Row) : void
	{
		this.rows$.set(row.rownum,row);
	}

	public getRow(rownum:number) : Row
	{
		return(this.rows$.get(rownum));
	}

	public displayed(record:Record) : Row
	{
		return(this.displayed$.get(record.id));
	}

	public display(rownum:number, record:Record) : void
	{
		let row:Row = this.getRow(rownum);
		this.displayed$.set(record.id,row);

		if (row.getFieldState() == FieldState.DISABLED)
			row.setFieldState(FieldState.READONLY);

		row.clear();
		this.applyProperties(row,record);

		record.values.forEach((field) =>
		{row.distribute(field.name,field.value,false);})
	}

	public lockUnused()
	{
		let row:Row = this.getRow(0);

		if (row.status == Status.na)
		{
			row.setFieldState(FieldState.READONLY);
			this.getRow(-1).setFieldState(FieldState.READONLY);
		}

		for (let i = 1; i < this.rows; i++)
		{
			row = this.getRow(i);
			if (row.status == Status.na) row.setFieldState(FieldState.DISABLED);
		}
	}

	public refresh(rownum:number, record:Record) : void
	{
		this.display(rownum,record);
		if (rownum == this.row) this.displaycurrent();
	}

	private openrow()
	{
		let row:Row = this.getRow(this.row);
		let current:Row = this.rows$.get(-1);

		if (row.getFieldState() == FieldState.READONLY)
		{
			row.setFieldState(FieldState.OPEN);

			if (current != null)
			{
				if (current.getFieldState() == FieldState.READONLY)
					current.setFieldState(FieldState.OPEN);
			}
		}
	}

	private displaycurrent() : void
	{
		let current:Row = this.rows$.get(-1);

		if (current != null)
		{
			current.clear();
			let record:Record = this.model.getRecord();

			this.applyProperties(current,record);
			record.values.forEach((field) => {current.distribute(field.name,field.value,false);});
		}
	}

	private setIndicators(prev:number, next:number) : void
	{
		if (next != null) this.getRow(next).avtivateIndicators(true);
		if (prev != null) this.getRow(prev).avtivateIndicators(false);
	}

	private applyProperties(row:Row, record:Record) : void
	{
		record.values.forEach((field) =>
		{
			row.getField(field.name)?.getInstances().
			forEach((inst) => {inst.applyProperties(this.recprops$.get(row,inst,record))})
		})
	}

	private async scroll(inst:FieldInstance, scroll:number) : Promise<FieldInstance>
	{
		let next:FieldInstance = inst;

		if (!await this.validate())
			return(next);

		if (this.row + scroll < 0 || this.row + scroll >= this.rows)
		{
			let available:number = 0;

			// fetch up from first, down from last
			if (scroll < 0) available = await this.model.prefetch(scroll,-this.row);
			else			available = await this.model.prefetch(scroll,this.rows-this.row-1);

			if (available <= 0) return(next);
			let move:boolean = (scroll > 1 && available <= this.row);

			if (move)
			{
				inst.ignore = "blur";

				let idx:number = this.getCurrentRow().getFieldIndex(inst);
				next = this.getRow(available-1).getFieldByIndex(idx);

				next.ignore = "focus";
			}

			if (!await this.form.LeaveField(inst))
				return(next);

			if (!await this.form.leaveRecord(this))
				return(next);

			this.model.scroll(scroll,this.row);

			await this.form.enterRecord(this,0);
			await this.form.enterField(inst,0);

			if (move)
			{
				this.setIndicators(this.row$,next.row);
				this.row$ = next.row;
			}

			this.displaycurrent();
			this.model.queryDetails();

			return(next);
		}

		this.getCurrentRow().validate();
		let idx:number = inst.field.row.getFieldIndex(inst);

		if (inst.row < 0)
		{
			if (this.getRow(this.row+scroll).status == Status.na)
				return(inst);

			if (!await this.form.LeaveField(inst))
				return(next);

			if (!await this.form.leaveRecord(this))
				return(next);

			if (!await this.form.enterRecord(this,scroll))
				return(next);

			if (!await this.form.enterField(inst,scroll))
				return(next);

			this.setCurrentRow(this.row+scroll);
		}
		else
		{
			let row:Row = this.getRow(this.row+scroll);
			if (row.status != Status.na) next = row.getFieldByIndex(idx);
		}

		return(next);
	}

	public finalize() : void
	{
		let rows:Row[] = [];
		this.rows$.forEach((row) => {rows.push(row)});
		this.form.getIndicators(this.name).forEach((ind) => this.getRow(ind.row)?.setIndicator(ind));

		/*
		 * If only 1 row, set rownum to 0;
		 * Otherwise sort all rows and re-number then from 0 - rows
		*/

		if (rows.length == 1)
			rows[0].rownum = 0;

		if (rows.length > 1)
		{
			let n:number = 0;
			rows = rows.sort((r1,r2) => {return(r1.rownum - r2.rownum)});

			for (let i = 0; i < rows.length; i++)
			{
				if (rows[i].rownum >= 0)
					rows[i].rownum = n++;
			}
		}

		this.rows$.clear();

		rows.forEach((row) =>
		{this.rows$.set(row.rownum,row)});

		this.rc$ = rows.length;
		if (this.getRow(-1) != null) this.rc$--;

		this.rows$.forEach((row) =>
		{
			row.finalize();

			if (row.rownum > 0)
				row.setFieldState(FieldState.DISABLED);
		});

		this.setIndicators(null,0);
		this.getRow(0)?.setFieldState(FieldState.READONLY);
		this.getRow(-1)?.setFieldState(FieldState.READONLY);
	}

	public distribute(field:Field, value:any, dirty:boolean) : void
	{
		let cr:number = this.row$;
		let fr:number = field.row.rownum;

		if (fr >= 0) this.getRow(-1)?.distribute(field.name,value,dirty);
		else		 this.getRow(cr)?.distribute(field.name,value,dirty);
	}

	public linkModel() : void
	{
		this.model$ = ModelForm.getForm(this.form.parent).getBlock(this.name);
	}

	private async fireKeyEvent(inst:FieldInstance, key:KeyMap) : Promise<boolean>
	{
		let frmevent:FormEvent = FormEvent.KeyEvent(this.form.parent,inst,key);
		return(FormEvents.raise(frmevent));
	}

	private async fireMouseEvent(inst:FieldInstance, mevent:MouseMap) : Promise<boolean>
	{
		let frmevent:FormEvent = FormEvent.MouseEvent(this.form.parent,mevent,inst);
		return(FormEvents.raise(frmevent));
	}

	private async fireFieldEvent(type:EventType, inst:FieldInstance) : Promise<boolean>
	{
		let frmevent:FormEvent = FormEvent.FieldEvent(type,inst);
		return(FormEvents.raise(frmevent));
	}
}
