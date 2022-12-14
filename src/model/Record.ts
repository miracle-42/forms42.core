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
import { DataSource } from "./interfaces/DataSource.js";
import { DataSourceWrapper } from "./DataSourceWrapper.js";

export enum RecordState
{
	New,
	Query,
	Deleted,
	Updated,
	Inserted,
	QueryFilter
}

export class Record
{
	private id$:any;
	private values$:any[] = [];
	private initial$:any[] = [];
	private response$:any = null;
	private failed$:boolean = false;
	private locked$:boolean = false;
	private prepared$:boolean = false;
	private flushing$:boolean = false;
	private source$:DataSource = null;
	private wrapper$:DataSourceWrapper = null;
	private dirty$:Set<string> = new Set<string>();
	private status$:RecordState = RecordState.Query;

	constructor(source:DataSource, data?:any[])
	{
		this.source$ = source;
		this.id$ = new Object();

		if (data != null)
		{
			for (let i = 0; i < data.length; i++)
				this.values$.push(data[i]);
		}
	}

	public get id() : any
	{
		return(this.id$);
	}

	public get block() : Block
	{
		return(this.wrapper$?.block);
	}

	public clear() : void
	{
		this.values$ = [];
		this.initial$ = [];
		this.dirty$.clear();
		this.locked$ = false;
		this.failed$ = false;
	}

	public setClean(release:boolean) : void
	{
		this.initial$ = [];
		this.dirty$.clear();
		this.failed$ = false;
		if (release) this.locked$ = false;
		this.initial$.push(...this.values$);
	}

	public get source() : DataSource
	{
		return(this.source$);
	}

	public get response() : any
	{
		return(this.response$);
	}

	public set response(response:any)
	{
		this.response$ = response;
	}

	public get wrapper() : DataSourceWrapper
	{
		return(this.wrapper$);
	}

	public set wrapper(wrapper:DataSourceWrapper)
	{
		this.wrapper$ = wrapper;
	}

	public get locked() : boolean
	{
		return(this.locked$);
	}

	public set locked(flag:boolean)
	{
		this.locked$ = flag;
	}

	public get failed() : boolean
	{
		return(this.failed$);
	}

	public set failed(flag:boolean)
	{
		this.failed$ = flag;
	}

	public get prepared() : boolean
	{
		return(this.prepared$);
	}

	public set prepared(flag:boolean)
	{
		this.prepared$ = flag;
	}

	public get flushing() : boolean
	{
		return(this.flushing$);
	}

	public set flushing(flag:boolean)
	{
		this.flushing$ = flag;
	}

	public get values() : {name:string,value:any}[]
	{
		let values:{name:string, value:any}[] = [];

		for (let i = 0; i < this.values$.length; i++)
			values.push({name: this.column(i), value: this.values$[i]});

		return(values);
	}

	public get state() : RecordState
	{
		return(this.status$);
	}

	public set state(status:RecordState)
	{
		this.status$ = status;
	}

	public get dirty() : boolean
	{
		return(this.dirty$.size > 0);
	}

	public get clean() : boolean
	{
		return(this.dirty$.size == 0);
	}

	public refresh() : void
	{
		let value:any = null;
		let values:{column:string; value:any}[] = [];

		this.source.columns?.forEach((col) =>
		{
			value = this.getInitialValue(col);
			values.push({column: col, value: value})
		});

		this.clear();

		values.forEach((entry) =>
		{this.initialize(entry.column, entry.value)})
	}

	public getValue(column:string) : any
	{
		if (column == null)
			return(null);

		column = column.toLowerCase();
		let idx:number = this.indexOf(column);
		return(this.values$[idx]);
	}

	public getInitialValue(column:string) : any
	{
		if (column == null)
			return(null);

		column = column.toLowerCase();
		let idx:number = this.indexOf(column);
		return(this.initial$[idx]);
	}

	public setValue(column:string,value:any) : void
	{
		if (column == null)
			return;

		column = column.toLowerCase();
		let idx:number = this.indexOf(column);

		let update:boolean = false;

		if (value != this.values$[idx])
			update = true;

		if (value instanceof Date || this.values$[idx] instanceof Date)
		{
			let nv:number|Date = value;
			if (nv instanceof Date) nv = nv.getTime();

			let ov:number|Date = value;
			if (ov instanceof Date) ov = ov.getTime();

			if (nv == ov) update = false;
		}

		if (idx < this.source.columns.length)
		{
			if (update && !this.flushing) this.dirty$.add(column);
			if (value == this.initial$[idx]) this.dirty$.delete(column);
		}

		this.values$[idx] = value;
	}

	public getDirty() : string[]
	{
		return([...this.dirty$]);
	}

	public setDirty(column?:string) : void
	{
		if (column == null)
			column = this.columns[0];

		column = column?.toLowerCase();
		let idx:number = this.indexOf(column);

		if (idx < this.source.columns.length)
			this.dirty$.add(column);
	}

	public get columns() : string[]
	{
		let columns:string[] = [];
		if (this.source) columns.push(...this.source.columns);
		if (this.wrapper) columns.push(...this.wrapper.columns);
		return(columns);
	}

	private indexOf(column:string) : number
	{
		let cols:number = this.source.columns.length;
		let idx:number = this.source.columns.indexOf(column);

		if (cols == null)
		{
			idx = -1;
			cols = 0;
		}

		if (idx < 0 && this.wrapper) idx = cols + this.wrapper.indexOf(column);
		return(idx);
	}

	private column(pos:number) : string
	{
		let len:number = this.source.columns.length;
		if (pos < len) return(this.source.columns[pos]);
		else    	      return(this.wrapper?.columns[pos-len]);
	}

	public toString() : string
	{
		let str:string = "";
		let cols:number = 0;

		if (this.source) cols += this.source.columns.length;
		if (this.wrapper) cols += this.wrapper?.columns.length;

		for (let i = 0; i < cols; i++)
			str += ", "+this.column(i)+"="+this.getValue(this.column(i));

		return(str.substring(2));
	}

	private initialize(column:string,value:any) : void
	{
		if (column == null)
			return;

		column = column.toLowerCase();
		let idx:number = this.indexOf(column);

		this.values$[idx] = value;
		this.initial$[idx] = value;
	}
}