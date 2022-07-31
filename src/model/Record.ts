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
import { DataSourceWrapper } from "./DataModel.js";

export enum RecordStatus
{
	New,
	Query,
	Insert,
	Update,
	Delete
}

export class Record
{
	private id$:any;
	private keys$:any[] = [];
	private values$:any[] = [];
	private columns$:string[] = null;
	private prepared$:boolean = false;
	private wrapper$:DataSourceWrapper;
	private status$:RecordStatus = RecordStatus.Query;

	constructor(wrapper:DataSourceWrapper, columns?:{[name:string]: any})
	{
		this.id$ = new Object();
		this.wrapper$ = wrapper;

		if (wrapper == null)
			this.columns$ = [];

		if (columns == null)
		{
			this.status$ = RecordStatus.New;
		}
		else
		{
			Object.keys(columns).forEach((col) =>
			{
				col = col.toLowerCase();

				if (wrapper == null)
					this.columns$.push(col);

				let idx:number = this.columns.indexOf(col);
				if (idx >= 0) this.values$[idx] = columns[col];
			});
		}
	}

	public get id() : any
	{
		return(this.id$);
	}

	public get keys() : any[]
	{
		return(this.keys$);
	}

	public get block() : Block
	{
		return(this.wrapper$?.block);
	}

	public get prepared() : boolean
	{
		return(this.prepared$);
	}

	public set prepared(flag:boolean)
	{
		this.prepared$ = flag;
	}

	public get columns() : string[]
	{
		if (this.wrapper$ == null) return(this.columns$);
		else 					   return(this.wrapper$.columns);
	}

	public get values() : {name:string,value:any}[]
	{
		let values:{name:string, value:any}[] = [];

		for (let i = 0; i < this.values$.length; i++)
			values.push({name: this.columns[i], value: this.values$[i]});

		return(values);
	}

	public get status() : RecordStatus
	{
		return(this.status$);
	}

	public set status(status:RecordStatus)
	{
		this.status$ = status;
	}

	public addKey(value:any) : void
	{
		this.keys$.push(value);
	}

	public getValue(column:string) : any
	{
		column = column.toLowerCase();
		let idx:number = this.columns.indexOf(column);
		return(this.values$[idx]);
	}

	public setValue(column:string,value:any) : void
	{
		column = column.toLowerCase();
		let idx:number = this.columns.indexOf(column);

		if (idx < 0)
		{
			idx = this.columns.length;
			this.columns.push(column);
		}

		this.values$[idx] = value;
	}

	public toString() : string
	{
		let str:string = "";

		for (let i = 0; i < this.columns.length; i++)
			str += ", "+this.columns[i]+"="+this.getValue(this.columns[i]);

		return(str.substring(2));
	}
}