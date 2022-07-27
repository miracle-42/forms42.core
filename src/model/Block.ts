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
import { Record } from "./Record.js";
import { Key } from "./relations/Key.js";
import { DataSourceWrapper } from "./DataModel.js";
import { Form as ViewForm } from "../view/Form.js";
import { Block as ViewBlock } from '../view/Block.js';
import { DataSource } from "./interfaces/DataSource.js";
import { EventTransaction } from "./EventTransaction.js";
import { Form as InterfaceForm } from '../public/Form.js';
import { MemoryTable } from "./datasources/MemoryTable.js";
import { EventType } from "../control/events/EventType.js";
import { Block as InterfaceBlock } from '../public/Block.js';
import { FormEvents, FormEvent } from "../control/events/FormEvents.js";


export class Block
{
	public static create(form:Form|ViewForm, block:InterfaceBlock|ViewBlock) : Block
	{
		if (form instanceof ViewForm)
			form = Form.getForm(form.parent);

		let blk:Block = form.getBlock(block.name);

		if (blk == null)
			blk = new Block(form,block.name);

		if (block instanceof InterfaceBlock)
			blk.link(block);

		return(blk);
	}

	public static getBlock(block:InterfaceBlock) : Block
	{
		return(Form.getForm(block.form).getBlock(block.name));
	}

	private form$:Form = null;
	private keys$:Key[] = [];
	private name$:string = null;
	private record$:number = -1;
	private view$:ViewBlock = null;
	private linked$:boolean = false;
	private columns$:string[] = null;
	private ctrlblk$:boolean = false;
	private source$:DataSource = null;
	private intfrm:InterfaceForm = null;
	private intblk:InterfaceBlock = null;

	private constructor(form:Form, name:string)
	{
		this.form$ = form;
		this.name$ = name;
		this.form$.addBlock(this);
		this.intfrm = form.parent;
		this.datasource = form.datamodel.getDataSource(this.name);
	}

	public get name() : string
	{
		return(this.name$);
	}

	public get form() : Form
	{
		return(this.form$);
	}

	public get empty() : boolean
	{
		return(this.record$ < 0);
	}

	public get view() : ViewBlock
	{
		return(this.view$);
	}

	public getBlock() : InterfaceBlock
	{
		return(this.intblk);
	}

	public get ctrlblk() : boolean
	{
		return(this.ctrlblk$);
	}

	public set ctrlblk(flag:boolean)
	{
		this.ctrlblk$ = flag;
	}

	public get columns() : string[]
	{
		if (this.columns$ == null)
			this.columns$ = this.view$.getFieldNames();

		return(this.columns$);
	}

	public get eventTransaction() : EventTransaction
	{
		return(this.form.eventTransaction);
	}

	public async setEventTransaction(event:EventType, offset:number) : Promise<boolean>
	{
		if (!await this.eventTransaction.ready(this,event))
			return(false);

		this.eventTransaction.join(event,this,null,offset,true);
		return(true);
	}

	public endEventTransaction(event:EventType, apply:boolean) : void
	{
		if (!apply) this.eventTransaction.undoChanges(event)
		else		this.eventTransaction.applyBlockChanges(event,this);
	}

	public get datasource() : DataSource
	{
		return(this.source$);
	}

	public set datasource(source:DataSource)
	{
		if (this.source$ != null)
		{
			this.form$.datamodel.clear(this);
			this.form$.datamodel.setWrapper(this);
		}

		this.ctrlblk = false;
		this.source$ = source;
	}

	public createMemorySource(recs?:number, columns?:string[]) : MemoryTable
	{
		let data:any[][] = [];

		if (recs == null)
		{
			recs = this.view$.rows;
			columns = this.columns;
		}

		for (let r = 0; r < recs; r++)
		{
			let row:any[] = [];

			for (let c = 0; c < columns.length; c++)
				row.push(null);

			data.push(row);
		}

		return(new MemoryTable(columns,data));
	}

	private get wrapper() : DataSourceWrapper
	{
		return(this.form.datamodel.getWrapper(this));
	}

	public get keys() : Key[]
	{
		return(this.keys$);
	}

	public addKey(name:string, fields:string|string[]) : void
	{
		this.keys$.push(new Key(name,this,fields));
	}

	public removeKey(name:string) : boolean
	{
		for (let i = 0; i < this.keys$.length; i++)
		{
			if (name == this.keys$[i].name)
			{
				this.keys$ = this.keys$.splice(i,1);
				return(true);
			}
		}

		return(false);
	}

	public async preInsert() : Promise<boolean>
	{
		let record:Record = new Record(null);
		await this.setModelEventTransaction(EventType.PreInsert,record);
		let success:boolean = await this.fire(EventType.PreInsert);
		this.endModelEventTransaction(EventType.PreInsert,success);
		return(success);
	}

	public async postInsert() : Promise<boolean>
	{
		await this.waitForEventTransaction(EventType.PostInsert);
		let success:boolean = await this.fire(EventType.PostInsert);
		this.endModelEventTransaction(EventType.PostInsert,success);
		return(success);
	}

	public async preUpdate() : Promise<boolean>
	{
		let record:Record = new Record(null);
		await this.setModelEventTransaction(EventType.PreUpdate,record);
		let success:boolean = await this.fire(EventType.PreUpdate);
		this.endModelEventTransaction(EventType.PreUpdate,success);
		return(success);
	}

	public async postUpdate() : Promise<boolean>
	{
		await this.waitForEventTransaction(EventType.PostUpdate);
		let success:boolean = await this.fire(EventType.PostUpdate);
		return(success);
	}

	public async preDelete() : Promise<boolean>
	{
		let record:Record = new Record(null);
		await this.setModelEventTransaction(EventType.PreDelete,record);
		let success:boolean = await this.fire(EventType.PreDelete);
		this.endModelEventTransaction(EventType.PreDelete,success);
		return(success);
	}

	public async postDelete() : Promise<boolean>
	{
		await this.waitForEventTransaction(EventType.PostDelete);
		let success:boolean = await this.fire(EventType.PostDelete);
		return(success);
	}

	public async preQuery() : Promise<boolean>
	{
		let record:Record = new Record(null);
		await this.setModelEventTransaction(EventType.PreQuery,record);
		let success:boolean = await this.fire(EventType.PreQuery);
		this.endModelEventTransaction(EventType.PreQuery,success);
		return(success);
	}

	public async onFetch(record:Record) : Promise<boolean>
	{
		await this.setModelEventTransaction(EventType.OnFetch,record);
		let success:boolean = await this.fire(EventType.OnFetch);
		this.endModelEventTransaction(EventType.OnFetch,success);
		return(success);
	}

	public async postQuery() : Promise<boolean>
	{
		await this.waitForEventTransaction(EventType.PostQuery);
		let success:boolean = await this.fire(EventType.PostQuery);
		return(success);
	}

	public async validateRecord() : Promise<boolean>
	{
		await this.setEventTransaction(EventType.WhenValidateRecord,0);
		let success:boolean = await this.fire(EventType.WhenValidateRecord);
		this.endEventTransaction(EventType.WhenValidateRecord,success);
		return(success);
	}

	public move(delta:number) : void
	{
		this.record$ = this.record + delta;
	}

	public get record() : number
	{
		if (this.record$ < 0) return(0);
		else				  return(this.record$);
	}

	public get interface() : InterfaceBlock
	{
		return(this.intblk);
	}

	public getValue(field:string) : any
	{
		return(this.wrapper.getValue(this.record,field));
	}

	public setValue(field:string, value:any) : boolean
	{
		if (this.columns.indexOf(field) < 0)
			this.columns.push(field);

		return(this.wrapper.setValue(this.record,field,value));
	}

	public async executeQuery() : Promise<boolean>
	{
		if (!await this.preQuery())
			return(false);

		if (!this.view.clear(true)) return(false);
		let wrapper:DataSourceWrapper = this.wrapper;

		this.record$ = -1;
		let record:Record = null;

		if (!await wrapper.query())
			return(false);

		if (!await this.postQuery())
			return(false);

		for (let i = 0; i < this.view.rows; i++)
		{
			record = await wrapper.fetch();

			if (record == null)
				break;

			this.record$ = 0;
			this.view.display(i,record);
			if (i == 0)	this.view$.setCurrentRow(0)
		}

		this.view.lockUnused();
		return(true);
	}

	public scroll(records:number, offset:number) : boolean
	{
		if (!this.view.clear(false))
			return(false);

		let displayed:number = 0;
		let wrapper:DataSourceWrapper = this.wrapper;
		let pos:number = this.record + records - offset;

		if (pos < 0)
		{
			pos = 0;
			records = offset - this.record;
		}

		for (let i = 0; i < this.view.rows; i++)
		{
			let rec:Record = wrapper.getRecord(pos++);

			if (rec == null)
				break;

			displayed++;
			this.view$.display(i,rec);
		}

		if (offset >= displayed)
			records = records - offset + displayed - 1;

		this.move(records);

		this.view.lockUnused();
		return(true);
	}

	public async queryDetails() : Promise<boolean>
	{
		console.log("queryDetails");
		return(true);
	}

	public async prefetch(records:number, offset:number) : Promise<number>
	{
		return(this.wrapper.prefetch(this.record+offset,records));
	}

	public getRecord(offset?:number) : Record
	{
		if (offset == null) offset = 0;
		return(this.wrapper.getRecord(this.record+offset));
	}

	public async copy(all?:boolean, header?:boolean) : Promise<string[][]>
	{
		return(this.wrapper?.copy(all,header));
	}

	public link(block:InterfaceBlock) : void
	{
		this.intblk = block;
		this.linked$ = true;
	}

	public linkView() : void
	{
		this.view$ = ViewForm.getForm(this.form$.parent).getBlock(this.name);
	}

	public unlinkView() : void
	{
		this.view$ = null;
	}

	public isLinked() : boolean
	{
		return(this.linked$);
	}

	public finalize() : void
	{
		if (this.intblk == null)
		{
			this.intblk = new InterfaceBlock(this.intfrm,this.name);
			this.linked$ = false;
		}
	}

	private async setModelEventTransaction(event:EventType, record:Record) : Promise<boolean>
	{
		if (!await this.eventTransaction.ready(this,event))
			return(false);

		this.eventTransaction.join(event,this,record,0,false);
		return(true);
	}

	public async waitForEventTransaction(event:EventType) : Promise<boolean>
	{
		return(this.eventTransaction.ready(null,event));
	}

	private endModelEventTransaction(event:EventType, apply:boolean) : void
	{
		if (!apply) this.eventTransaction.undoChanges(event)
		else		this.eventTransaction.applyBlockChanges(event,this);
	}

	private async fire(type:EventType) : Promise<boolean>
	{
		let frmevent:FormEvent = FormEvent.BlockEvent(type,this.intfrm,this.name);
		return(FormEvents.raise(frmevent));
	}
}