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

import { Alert } from "../application/Alert.js";
import { Record, RecordState } from "./Record.js";
import { Relation } from "./relations/Relation.js";
import { FilterStructure } from "./FilterStructure.js";
import { Block as ModelBlock } from "../model/Block.js";
import { DataSource } from "./interfaces/DataSource.js";

export class DataSourceWrapper
{
	private eof$:boolean;
	private cache$:Record[];
	private hwm$:number = 0;
	private columns$:string[] = [];
	private source$:DataSource = null;
	private modified$:boolean = false;

	constructor(public block?:ModelBlock)
	{
		this.cache$ = [];
		this.eof$ = true;
	}

	public get source() : DataSource
	{
		if (this.source$ == null)
			this.source$ = this.block?.datasource;

		return(this.source$);
	}

	public set source(source:DataSource)
	{
		this.source$ = source;
	}

	public get columns() : string[]
	{
		return(this.columns$);
	}

	public set columns(columns:string[])
	{
		this.columns$ = columns;
	}

	public get dirty() : boolean
	{
		return(this.modified$);
	}

	public set dirty(flag:boolean)
	{
		this.modified$ = flag;

		if (!this.dirty)
		{
			for (let i = 0; i < this.cache$.length; i++)
				this.cache$[i].setClean(true);
		}
	}

	public async clear() : Promise<boolean>
	{
		this.hwm$ = 0;
		this.cache$ = [];
		this.columns$ = [];

		if (!await this.source.closeCursor())
			return(false);

		return(this.flush());
	}

	public getDirtyCount() : number
	{
		let dirty:number = 0;

		for (let i = 0; i < this.cache$.length; i++)
		{
			if (this.cache$[i].dirty && this.cache$[i].prepared)
				dirty++;
		}

		return(dirty);
	}

	public async undo() : Promise<Record[]>
	{
		return(this.source.undo());
	}

	public async flush() : Promise<boolean>
	{
		try
		{
			this.cache$.forEach((record) =>
			{
				if (record.state == RecordState.Inserted)
					this.linkToMasters(record);
			});

			let succces:boolean = true;
			let records:Record[] = await this.source.flush();

			for (let i = 0; i < records.length; i++)
			{
				if (!records[i].dirty || records[i].failed)
					continue;

				if (records[i].state == RecordState.Inserted)
				{
					records[i].flushing = true;
					succces = await this.block.postInsert(records[i]);
					records[i].flushing = false;

					if (succces)
					{
						records[i].state = RecordState.Query;
						this.block.view.setStatus(records[i]);
						records[i].setClean(false);
					}
				}

				if (records[i].state == RecordState.Updated)
				{
					records[i].flushing = true;
					succces = await this.block.postUpdate(records[i]);
					records[i].flushing = false;

					if (succces)
					{
						records[i].state = RecordState.Query;
						this.block.view.setStatus(records[i]);
						records[i].setClean(false);
					}
				}

				if (records[i].state == RecordState.Deleted)
				{
					records[i].flushing = true;
					succces = await this.block.postDelete(records[i]);
					records[i].flushing = false;
					records[i].setClean(false);
				}
			}

			return(true);
		}
		catch (error)
		{
			Alert.fatal(error+"","Backend failure")
			return(false);
		}
	}

	public getValue(record:number, field:string) : any
	{
		return(this.cache$[record]?.getValue(field));
	}

	public setValue(record:number, field:string, value:any) : boolean
	{
		if (record < 0 || record >= this.cache$.length)
			return(false);

		this.cache$[record].setValue(field,value);
		return(true);
	}

	public locked(record:Record) : boolean
	{
		if (!this.source.rowlocking)
			return(true);

		if (record.state == RecordState.New || record.state == RecordState.Inserted)
			return(true);

		return(record.locked);
	}

	public async lock(record:Record) : Promise<boolean>
	{
		this.dirty = true;

		if (this.locked(record))
			return(true);

		if (!this.source.rowlocking)
			return(true);

		let success:boolean = await this.source.lock(record);

		if (success) record.locked = true;
		else 			 record.failed = true;

		return(success);
	}

	public async refresh(record:Record) : Promise<void>
	{
		if (record.state == RecordState.Deleted)
			return;

		await this.source.refresh(record);

		record.setClean(false);

		switch(record.state)
		{
			case RecordState.New : break;

			case RecordState.Inserted :
			{
				record.state = RecordState.New;
				await this.block.preInsert(record);
				break;
			}

			default:
			{
				record.state = RecordState.Query;
				await this.block.onFetch(record);
			}
		}
	}

	public async modified(record:Record, deleted:boolean) : Promise<boolean>
	{
		let succces:boolean = true;

		if (record == null)
			return(true);

		if (deleted)
		{
			record.setDirty();
			this.dirty = true;

			if (record.state == RecordState.New || record.state == RecordState.Inserted)
			{
				record.locked = true;
			}
			else
			{
				if (!await this.source.lock(record))
					return(false);
			}

			succces = await this.delete(record);
			if (succces) record.state = RecordState.Deleted;
		}
		else if (record.dirty)
		{
			if (record.state == RecordState.New)
			{
				this.dirty = true;
				succces = await this.insert(record);
				if (succces) record.state = RecordState.Inserted;
			}

			if (record.state == RecordState.Query)
			{
				this.dirty = true;
				succces = await this.update(record);
				if (succces) record.state = RecordState.Updated;
			}

			if (record.state == RecordState.Inserted)
			{
				this.dirty = true;
				succces = await this.update(record);
			}

			if (record.state == RecordState.Updated)
			{
				this.dirty = true;
				succces = await this.update(record);
			}
		}

		return(succces);
	}

	public create(pos:number, before?:boolean) : Record
	{
		this.hwm$++;
		this.dirty = true;

		if (pos > this.cache$.length)
			pos = this.cache$.length - 1;

		if (before && pos >= 0) pos--;
		let inserted:Record = new Record(this.source);
		this.cache$.splice(pos+1,0,inserted);

		inserted.wrapper = this;
		inserted.prepared = true;
		inserted.state = RecordState.New;

		return(inserted);
	}

	public async insert(record:Record) : Promise<boolean>
	{
		if (!await this.block.preInsert(record))
			return(false);

		if (!await this.source.insert(record))
			return(false);

		return(true);
	}

	public async update(record:Record) : Promise<boolean>
	{
		if (!await this.block.preUpdate(record))
			return(false);

		if (!await this.source.update(record))
			return(false);

		return(true);
	}

	public async delete(record:Record) : Promise<boolean>
	{
		let pos:number = this.index(record);

		if (pos < 0)
			return(false);

		if (!await this.block.preDelete(record))
			return(false);

		if (!await this.source.delete(record))
			return(false);

		this.hwm$--;
		this.cache$.splice(pos,1);

		record.state = RecordState.Deleted;
		return(true);
	}

	public getRecord(record:number) : Record
	{
		return(this.cache$[record]);
	}

	public async query(filter?:FilterStructure) : Promise<boolean>
	{
		let success:boolean = await this.source.query(filter);

		if (success)
		{
			this.hwm$ = 0;
			this.cache$ = [];
			this.eof$ = false;
		}

		return(success);
	}

	public async fetch() : Promise<Record>
	{
		if (this.hwm$ >= this.cache$.length)
		{
			if (this.eof$) return(null);
			let recs:Record[] = await this.source.fetch();

			if (recs == null || recs.length == 0)
			{
				this.eof$ = true;
				return(null);
			}

			if (recs.length < this.source.arrayfecth)
				this.eof$ = true;

			this.cache$.push(...recs);
			recs.forEach((rec) => rec.state = RecordState.Query);
		}

		let record:Record = this.cache$[this.hwm$];

		if (!record.prepared)
		{
			record.setClean(true);
			record.wrapper = this;
			await this.block.onFetch(record);
			record.prepared = true;
		}

		this.hwm$++;
		return(record);
	}

	public async prefetch(record:number,records:number) : Promise<number>
	{
		let possible:number = 0;

		if (records < 0)
		{
			possible = record > -records ? -records : record;
		}
		else
		{
			possible = this.hwm$ - record - 1;
			let fetch:number = records - possible;

			for (let i = 0; i < fetch; i++)
			{
				if (await this.fetch() == null)
					break;

				possible++;
			}

			if (possible > records)
				possible = records;
		}

		if (possible < 0) possible = 0;
		return(possible);
	}

	public indexOf(column:string) : number
	{
		let idx:number = this.columns$.indexOf(column);

		if (idx < 0)
		{
			this.columns$.push(column);
			idx = this.columns$.length-1;
		}

		return(idx);
	}

	public async copy(header?:boolean, all?:boolean) : Promise<any[][]>
	{
		let table:any[][] = [];
		while(all && await this.fetch() != null);

		let head:string[] = [];
		head.push(...this.columns);
		head.push(...this.source.columns);

		if (header)
			table.push(head);

		this.cache$.forEach((record) =>
		{
			if (record.prepared)
			{
				let data:any[] = [];
				head.forEach((col) => {data.push(record.getValue(col))})
				table.push(data);
			}
		})

		return(table);
	}

	public index(record:Record) : number
	{
		if (record == null)
			return(-1);

		for (let i = 0; i < this.cache$.length; i++)
		{
			if (this.cache$[i].id == record.id)
				return(i);
		}

		return(-1);
	}

	private linkToMasters(record:Record) : void
	{
		let masters:ModelBlock[] = this.block.getMasterBlocks();

		for (let i = 0; i < masters.length; i++)
		{
			let rel:Relation = this.block.findMasterRelation(masters[i]);

			for (let f = 0; f < rel.detail.fields.length; f++)
			{
				let col:string = rel.detail.fields[i];
				let mst:string = rel.master.fields[i];

				if (record.getValue(col) == null)
					record.setValue(col,masters[i].getValue(mst));
			}
		}
	}
}