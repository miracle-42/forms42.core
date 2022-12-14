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

import { Filter } from "../interfaces/Filter.js";
import { Record, RecordState } from "../Record.js";
import { FilterStructure } from "../FilterStructure.js";
import { DataSource } from "../interfaces/DataSource.js";

export class MemoryTable implements DataSource
{
	public name:string;
	public arrayfecth:number = 1;
	public queryallowed:boolean = true;
	public insertallowed:boolean = true;
	public updateallowed:boolean = true;
	public deleteallowed:boolean = true;

	private pos$:number = 0;
	private order$:string = null;
	private dirty$:Record[] = [];
	private columns$:string[] = [];
	private records$:Record[] = [];
	private sorting$:SortOrder[] = [];
	private limit$:FilterStructure = null;

	private filter:FilterStructure;

	public constructor(columns?:string|string[], records?:number|any[][])
	{
		if (columns == null) columns = [];
		if (records == null) records = [];

		if (!Array.isArray(columns))
			columns = [columns];

		this.columns$ = columns;

		if (typeof records === "number")
		{
			let rows:number = records;

			records = [];
			if (columns != null && columns.length > 0)
			{
				for (let r = 0; r < rows; r++)
				{
					let row:any[] = [];

					for (let c = 0; c < columns.length; c++)
						row.push(null);

					records.push(row);
				}
			}
		}

		records.forEach((rec) =>
		{
			this.records$.push(new Record(this,rec));
		});
	}

	public get rowlocking() : boolean
	{
		return(false);
	}

	public setData(data:any[][]) : void
	{
		this.records$ = [];
		data.forEach((row) =>
		{this.records$.push(new Record(this,row));})
	}

	public clone(columns?:string|string[]) : MemoryTable
	{
		let table:any[][] = [];

		if (columns == null)
		{
			columns = [];
			columns.push(...this.columns$);
		}

		if (!Array.isArray(columns))
			columns = [columns];

		for (let r = 0; r < this.records$.length; r++)
		{
			let row:any[] = [];

			for (let c = 0; c < columns.length; c++)
				row[c] = this.records$[r].getValue(columns[c]);

			table.push(row);
		}

		let clone:MemoryTable = new MemoryTable(columns,table);

		clone.sorting = this.sorting;
		clone.arrayfecth = this.arrayfecth;

		return(clone);
	}

	public get sorting() : string
	{
		return(this.order$);
	}

	public set sorting(order:string)
	{
		this.order$ = order;
		this.sorting$ = SortOrder.parse(order);
	}

	public get columns() : string[]
	{
		return(this.columns$);
	}

	public addColumns(columns:string|string[]) : MemoryTable
	{
		if (!Array.isArray(columns))
			columns = [columns];

		columns.forEach((column) =>
		{
			column = column?.toLowerCase();

			if (column && !this.columns$.includes(column))
				this.columns$.push(column);
		})

		return(this);
	}

	public addFilter(filter:Filter | FilterStructure) : MemoryTable
	{
		if (this.limit$ == null)
		{
			if (filter instanceof FilterStructure)
			{
				this.limit$ = filter;
				return(this);
			}

			this.limit$ = new FilterStructure();
		}

		this.limit$.and(filter);
		return(this);
	}

	public async lock(_record:Record) : Promise<boolean>
	{
		return(true);
	}

	public async undo() : Promise<Record[]>
	{
		let undo:Record[] = [];

		for (let i = 0; i < this.dirty$.length; i++)
		{
			this.dirty$[i].refresh();
			undo.push(this.dirty$[i]);

			switch(this.dirty$[i].state)
			{
				case RecordState.New:

				case RecordState.Inserted:

					this.delete(this.dirty$[i]);
					this.dirty$[i].state = RecordState.Deleted;
					break;

				case RecordState.Updated:
					this.dirty$[i].state = RecordState.Query;
					break;

				case RecordState.Deleted:
					this.dirty$[i].state = RecordState.Query;
					break;
			}
		}

		return(undo);
	}

	public async flush() : Promise<Record[]>
	{
		let processed:Record[] = [];

		this.dirty$.forEach((rec) =>
		{
			if (rec.state == RecordState.Inserted)
			{
				processed.push(rec);
				this.records$.push(rec);
				rec.response = "inserted";
			}

			if (rec.state == RecordState.Updated)
			{
				processed.push(rec);
				rec.response = "updated";
			}

			if (rec.state == RecordState.Deleted)
			{
				processed.push(rec);
				rec.response = "deleted";

				let recno:number = this.indexOf(this.records$,rec.id);

				if (recno >= 0)
				{
					this.pos$--;
					this.records$.splice(recno,1);
				}
			}
		});

		this.dirty$ = [];
		return(processed);
	}

	public async refresh(record:Record) : Promise<boolean>
	{
		record.refresh();
		return(true);
	}

	public async insert(record:Record) : Promise<boolean>
	{
		if (!this.dirty$.includes(record))
			this.dirty$.push(record);
		return(true);
	}

	public async update(record:Record) : Promise<boolean>
	{
		if (!this.dirty$.includes(record))
			this.dirty$.push(record);
		return(true);
	}

	public async delete(record:Record) : Promise<boolean>
	{
		if (!this.dirty$.includes(record))
			this.dirty$.push(record);
		return(true);
	}

	public async query(filter?:FilterStructure) : Promise<boolean>
	{
		this.pos$ = 0;
		this.filter = filter;

		if (this.limit$ != null)
		{
			if (!this.filter) this.filter = this.limit$;
			else this.filter.and(this.limit$,"limit");
		}

		if (this.sorting$.length > 0)
		{
			this.records$ = this.records$.sort((r1,r2) =>
			{
				for (let i = 0; i < this.sorting$.length; i++)
				{
					let column:string = this.sorting$[i].column;
					let ascending:boolean = this.sorting$[i].ascending;

					let value1:any = r1.getValue(column);
					let value2:any = r2.getValue(column);

					if (value1 < value2)
						return(ascending ? -1 : 1)

					if (value1 > value2)
						return(ascending ? 1 : -1)

					return(0);
				}
			})
		}

		return(true);
	}

	public async fetch() : Promise<Record[]>
	{
		if (this.pos$ >= this.records$.length)
			return([]);

		while(this.pos$ < this.records$.length)
		{
			if (this.filter.empty)
				return([this.records$[this.pos$++]]);

			if (await this.filter.evaluate(this.records$[this.pos$]))
				return([this.records$[this.pos$++]]);

			this.pos$++;
		}

		return([]);
	}

	public async closeCursor() : Promise<boolean>
	{
		return(true);
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

class SortOrder
{
	column:string;
	ascending:boolean = true;

	static parse(order:string) : SortOrder[]
	{
		let sorting:SortOrder[] = [];

		if (order != null)
		{
			let parts:string[] = order.split(",");

			parts.forEach((column) =>
			{
				column = column.trim();

				if (column.length > 0)
				{
					let ascending:string = null;

					if (column.includes(' '))
					{
						let tokens:string[] = column.split(' ');

						column = tokens[0].trim();
						ascending = tokens[1].trim();
					}

					column = column.toLowerCase();
					ascending = ascending?.toLowerCase();

					let part:SortOrder = new SortOrder();

					part.column = column;
					if (ascending == "desc") part.ascending = false;

					sorting.push(part);
				}
			})
		}

		return(sorting);
	}
}