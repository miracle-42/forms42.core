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

import { Block } from "./Block.js";
import { Record } from "./Record.js";
import { Alert } from "../application/Alert.js";
import { Field } from "../view/fields/Field.js";
import { Block as ViewBlock } from "../view/Block.js";
import { EventType } from "../control/events/EventType.js";
import { FieldInstance } from "../view/fields/FieldInstance.js";
import { FieldProperties } from "../view/fields/FieldProperties.js";
import { FieldFeatureFactory } from "../view/FieldFeatureFactory.js";

/*
	The EventTransaction ensures that changes to records only gets applied if all
	eventhandlers returns true.

	When a transaction is active, it is only possible to do changes to records
	participating in the transction and to control-blocks.

	During FormEvents, only changes to control-blocks is possible.
*/

export class EventTransaction
{
	private frmtrx:Transaction = null;

	private blocktrxs:Map<string,Transaction> =
		new Map<string,Transaction>();

	private nontrxblks:Map<string,Transaction> =
		new Map<string,Transaction>();

	public join(event:EventType, block?:Block, record?:Record, offset?:number, applyvw?:boolean) : void
	{
		let trx:Transaction = null;

		if (this.nontrxblks == null)
			this.nontrxblks = new Map<string,Transaction>();

		if (block != null)
		{
			if (offset == null) offset = 0;
			if (applyvw == null) applyvw = true;
			if (record == null) record = block.getRecord(offset);

			trx = new Transaction(event,block,record,offset,applyvw);
			this.blocktrxs.set(block.name,trx);
		}
		else
		{
			this.frmtrx = new Transaction(event);
		}
	}

	// Either a Form or multiple Block trx's
	public async ready(block:Block, event:EventType) : Promise<boolean>
	{
		let tries:number = 0;
		let maxtries:number = 300;

		if (EventType[event].includes("Form") || event == EventType.PostViewInit)
		{
			while(tries++ < maxtries && (this.formtrx || this.blocktrxs.size > 0))
				await this.sleep(10);
		}
		else
		{
			while(tries++ < maxtries && this.frmtrx != null)
				await this.sleep(10);

			while(tries++ < maxtries && block != null && this.blocktrxs.get(block.name))
				await this.sleep(10);
		}

		if (tries >= maxtries)
		{
			let str:string = "form: "+EventType[this.frmtrx?.event];
			this.blocktrxs.forEach((trx,blk) => {str += " "+blk+": "+EventType[trx.event]})
			Alert.fatal("could not start transaction "+EventType[event]+", running: "+str,"EventTransaction");
			return(false);
		}

		return(true);
	}

	public get active() : boolean
	{
		return(this.frmtrx != null || this.blocktrxs.size > 0);
	}

	public getTrxRecord(block:string) : Record
	{
		return(this.blocktrxs.get(block)?.blocktrx.record);
	}

	public getProperties(inst:FieldInstance) : FieldProperties
	{
		let trx:Transaction = this.getActive(inst.block);

		let propmap:Map<string,BlockProperties> = trx.blkprops;
		let blkprop:BlockProperties = propmap.get(inst.block);

		if (blkprop == null)
		{
			blkprop = new BlockProperties();
			propmap.set(inst.block,blkprop);
		}

		let instprop:InstanceProperties = blkprop.get(inst);
		return(instprop.properties);
	}

	public getDefaultProperties(inst:FieldInstance) : FieldProperties
	{
		let trx:Transaction = this.getActive(inst.block);

		let propmap:Map<string,BlockProperties> = trx.blkprops;
		let blkprop:BlockProperties = propmap.get(inst.block);

		if (blkprop == null)
		{
			blkprop = new BlockProperties();
			propmap.set(inst.block,blkprop);
		}

		let instprop:InstanceProperties = blkprop.get(inst);
		return(instprop.defproperties);
	}

	public addPropertyChange(inst:FieldInstance, props:FieldProperties, defprops:boolean) : void
	{
		let trx:Transaction = this.getActive(inst.block);

		if (trx == null && this.nontrxblks != null)
			trx = this.nontrxblks.get(props.inst.block);

		if (trx == null)
			return;

		let propmap:Map<string,BlockProperties> = trx.blkprops;
		let blkprop:BlockProperties = propmap.get(inst.block);

		let instprop:InstanceProperties = blkprop.get(inst);

		if (!defprops) instprop.properties = props;
		else		   instprop.defproperties = props;
	}

	public getValue(block:Block|ViewBlock, field:string) : any
	{
		let trx:BlockTransaction = this.getActive(block.name)?.blocktrx;
		if (block instanceof ViewBlock) block = block.model;

		if (trx == null && block.ctrlblk)
			trx = this.nontrxblks?.get(block.name)?.blocktrx;

		if (trx == null)
		{
			let fld:Field = block.view.getField(field);
			if (fld != null) return(fld.getValue());
			else return(block.getValue(field));
		}

		return(trx.getValue(field));
	}

	public setValue(block:Block|ViewBlock, field:string, value:any) : boolean
	{
		let trx:BlockTransaction = this.getActive(block.name)?.blocktrx;
		if (block instanceof ViewBlock) block = block.model;

		if (trx == null && block.ctrlblk && this.nontrxblks != null)
		{
			trx = this.nontrxblks.get(block.name)?.blocktrx;

			if (trx == null)
			{
				let event:EventType = this.getActive().event;
				let ctrl:Transaction = new Transaction(event,block,null,0,true);

				this.nontrxblks.set(block.name,ctrl);
				trx = ctrl.blocktrx;
			}
		}

		if (trx == null && !block.ctrlblk)
		{
			Alert.fatal("Block '"+block.name+"' is not in transaction","setProperties");
			return(false);
		}

		return(trx.setValue(field,value));
	}

	public applyFormChanges(_event:EventType) : void
	{
		this.frmtrx?.apply();

		this.nontrxblks?.forEach((trx) =>
			{trx.blocktrx.apply()})

		this.nontrxblks?.clear();
		this.frmtrx = null;
	}

	public applyBlockChanges(_event:EventType, block:Block|ViewBlock) : void
	{
		let trx:Transaction = this.blocktrxs.get(block.name);

		if (trx == null)
		{
			Alert.fatal("Block '"+block.name+"' is not in transaction","setProperties");
			return;
		}

		trx.apply();
		this.blocktrxs.delete(block.name);

		if (this.blocktrxs.size == 0)
		{
			this.nontrxblks?.forEach((trx) =>
				{trx.apply();})

			this.nontrxblks?.clear();
		}
	}

	public undoChanges(_event:EventType, block?:Block|ViewBlock) : void
	{
		if (block == null) this.frmtrx = null;
		else this.blocktrxs.delete(block.name);
		this.nontrxblks = null;
	}

	private getActive(block?:string) : Transaction
	{
		if (this.frmtrx != null)
			return(this.frmtrx);

		if (block != null)
			return(this.blocktrxs.get(block));

		block = this.blocktrxs.keys().next().value;
		return(this.blocktrxs.get(block));
	}

	private get formtrx() : boolean
	{
		return(this.frmtrx != null)
	}

	private sleep(ms:number) : Promise<void>
    {
        return(new Promise(resolve => setTimeout(resolve,ms)));
    }
}

class Transaction
{
	event:EventType = null;
	blocktrx:BlockTransaction = null;

	blkprops:Map<string,BlockProperties> =
		new Map<string,BlockProperties>();

	constructor(event:EventType, block?:Block, record?:Record, offset?:number, applyvw?:boolean)
	{
		this.event = event;

		if (block != null)
			this.blocktrx = new BlockTransaction(event,block,record,offset,applyvw);
	}

	apply() : void
	{
		this.blocktrx?.apply();

		this.blkprops.forEach((props) =>
			props.apply(this.blocktrx?.applyvw,this.blocktrx?.record));
	}
}

export interface PropertyChange
{
	defprops:boolean;
	inst:FieldInstance;
	props:FieldProperties;
}


class BlockTransaction
{
	offset:number = 0;
	block:Block = null;
	record:Record = null;
	wrkcpy:Record = null;
	event:EventType = null;
	applyvw:boolean = true;

	constructor(event:EventType, block:Block, record:Record, offset:number, applyvw:boolean)
	{
		this.event = event;
		this.block = block;
		this.offset = offset;
		this.record = record;
		this.applyvw = applyvw;
	}

	public getValue(field:string) : any
	{
		if (this.event == EventType.OnTyping && this.block.view.getVolatileInstance().name == field)
			return(this.block.view.getField(field).getValue());

		if (this.wrkcpy == null)
		{
			if (this.applyvw)
			{
				let fld:Field = this.block.view.getField(field);
				if (fld != null) return(fld.getValue());
			}

			return(this.record.getValue(field));
		}

		return(this.wrkcpy.getValue(field));
	}

	public setValue(field:string, value:any) : boolean
	{
		if (this.wrkcpy == null)
		{
			this.wrkcpy = new Record(null);

			this.record.values.forEach((column) =>
			{this.wrkcpy.setValue(column.name,column.value)})
		}

		this.wrkcpy.setValue(field,value);
		return(true);
	}

	public apply() : void
	{
		if (this.wrkcpy == null)
			return;

		this.wrkcpy.values.forEach((column) =>
		{this.record.setValue(column.name,column.value)});

		if (this.applyvw)
		{
			let rownum:number = this.block.view.row;
			this.block.view.refresh(rownum+this.offset,this.record);
		}
	}
}

class BlockProperties
{
	private instances:Map<FieldInstance,InstanceProperties> =
		new Map<FieldInstance,InstanceProperties>();

	get(inst:FieldInstance) : InstanceProperties
	{
		let instprop:InstanceProperties = this.instances.get(inst);

		if (instprop == null)
		{
			instprop = new InstanceProperties(inst);
			this.instances.set(inst,instprop);
		}

		return(instprop);
	}

	apply(applyvw:boolean, record:Record) : void
	{
		this.instances.forEach((instprop) =>
			{instprop.apply(applyvw,record)})
	}
}

class InstanceProperties
{
	inst:FieldInstance;
	pchange:boolean = false;
	dchange:boolean = false;
	properties$:FieldProperties = null;
	defproperties$:FieldProperties = null;

	constructor(inst:FieldInstance)
	{
		this.inst = inst;
		this.properties = inst.properties;
		this.defproperties$ = FieldFeatureFactory.clone(inst.defaultProperties);
	}

	set properties(props:FieldProperties)
	{
		this.pchange = true;
		this.properties$ = props;
	}

	set defproperties(props:FieldProperties)
	{
		this.dchange = true;
		this.defproperties$ = props;
	}

	get properties() : FieldProperties
	{
		return(this.properties$);
	}

	get defproperties() : FieldProperties
	{
		return(this.defproperties$);
	}

	apply(applyvw:boolean, record:Record) : void
	{
		if (applyvw == null)
			applyvw = true;

		if (this.pchange)
		{
			if (applyvw) this.inst.applyProperties(this.properties$);
			else this.inst.field.block.setRecordProperties(record,this.inst,this.properties$);

		}

		if (this.dchange)
		{
			FieldFeatureFactory.copyBasic(this.defproperties$,this.inst.defaultProperties);
			this.inst.updateDefaultProperties();
		}
	}
}