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

import { Record } from "../Record.js";
import { Filter } from "../interfaces/Filter.js";
import { DataSource } from "../interfaces/DataSource.js";

export class MemoryTable implements DataSource
{
	private pos$:number = 0;
	private rows$:number = -1;
	private records:Record[] = [];
	private filters:Filter[] = [];
	private cursor:Record[] = null;
	private inserted$:Record[] = [];

	public arrayfecth:number = 1;
	private insertable$:boolean = true;

	public queryable:boolean  = true;
	public updateable:boolean = true;
	public deleteable:boolean = true;

	public constructor(columns?:string[], records?:any[][])
	{
		if (columns != null && records != null)
		{
			records.forEach((rec) =>
			{
				let data:{[name:string]: any} = {};

				for (let i = 0; i < rec.length && i < columns.length; i++)
					data[columns[i]] = rec[i];

				this.records.push(new Record(null,data));
			});
		}
	}

	public set maxrows(rows:number)
	{
		this.rows$ = rows;
	}

	public get insertable() : boolean
	{
		return(this.insertable$ && this.records.length < this.rows$);
	}

	public set insertable(flag:boolean)
	{
		this.insertable$ = flag;
	}

	public getFilters() : Filter[]
	{
		return(this.filters);
	}

	public addFilter(filter:Filter) : void
	{
		this.filters.push(filter);
	}

	public setFilters(filters:Filter[]) : void
	{
		this.filters = filters;
	}

	public async lock(_record:Record) : Promise<boolean>
	{
		return(true);
	}

	public async post() : Promise<boolean>
	{
		this.records.push(...this.inserted$);
		return(true);
	}

	public async refresh(_record:Record) : Promise<void>
	{
		null;
	}

	public async insert(record:Record) : Promise<boolean>
	{
		this.inserted$.push(record);
		return(true);
	}

	public async update(_record:Record) : Promise<boolean>
	{
		return(true);
	}

	public async delete(record:Record) : Promise<boolean>
	{
		let rec:number = this.indexOf(this.records,record.id);
		let ins:number = this.indexOf(this.inserted$,record.id);

		if (ins >= 0)
			this.inserted$ = this.inserted$.splice(ins,1);

		if (rec >= 0)
			this.records = this.records.splice(rec,1);

		return(ins >= 0 || rec >= 0);
	}

	public async fetch() : Promise<Record[]>
	{
		let cursor:Record[] = this.cursor;
		if (this.pos$ >= cursor.length) return([]);
		return([cursor[this.pos$++]]);
	}

	public async query() : Promise<boolean>
	{
		this.post();

		if (!this.queryable)
			return(false);

		this.cursor = this.records;
		return(true);
	}

	public closeCursor(): void
	{
		this.cursor = null;
	}

	private indexOf(records:Record[],oid:any) : number
	{
		for (let i = 0; i < records.length; i++)
		{
			if (records[i].id == oid)
				return(i);
		}
		return(-1);
	}
}