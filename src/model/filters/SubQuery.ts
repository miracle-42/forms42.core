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
import { BindValue } from "../../database/BindValue.js";


export class SubQuery implements Filter
{
	private bindval$:string = null;
	private subquery$:string = null;
	private columns$:string[] = null;
	private constraint$:any[][] = null;
	private bindvalues$:BindValue[] = [];

	public constructor(columns:string|string[])
	{
		this.columns$ = [];

		if (typeof columns === "string")
		{
			let list:string[] = [];

			columns.split(",").forEach((column) =>
			{
				column = column.trim();

				if (column.length > 0)
					list.push(column);
			})

			columns = list;
		}

		if (!Array.isArray(columns))
			columns = [columns];

		this.columns$ = columns;
		this.bindval$ = columns[0];

		for (let i = 1; i < columns.length; i++)
			this.bindval$ += "."+columns[i];
	}

	public get columns() : string[]
	{
		return(this.columns$);
	}

	public get subquery() : string
	{
		return(this.subquery$);
	}

	public set subquery(sql:string)
	{
		this.subquery$ = sql;
	}

	public clone() : SubQuery
	{
		let clone:SubQuery = new SubQuery(this.columns$);

		clone.subquery$ = this.subquery$;
		clone.bindvalues$ = this.bindvalues$;

		return(clone.setConstraint(this.constraint$));
	}

	public clear() : void
	{
		this.constraint$ = null;
	}

	public getBindValueName() : string
	{
		return(this.bindval$);
	}

	public setBindValueName(name:string) : SubQuery
	{
		this.bindval$ = name;
		return(this);
	}

	public setConstraint(values:any[][]) : SubQuery
	{
		this.constraint = values;
		return(this);
	}

	public get constraint() : any[][]
	{
		return(this.constraint$);
	}

	public set constraint(table:any[][])
	{
		this.constraint$ = table;
	}

	public getBindValue(): BindValue
	{
		if (this.bindvalues$)
			return(this.getBindValues()[0]);

		return(null);
	}

	public getBindValues(): BindValue[]
	{
		return(this.bindvalues$);
	}

	public setBindValues(bindvalues:BindValue|BindValue[]) : void
	{
		if (!Array.isArray(bindvalues))
			bindvalues = [bindvalues];

		this.bindvalues$ = bindvalues;
	}

	public async evaluate(record:Record) : Promise<boolean>
	{
		let values:any[] = [];
		if (this.columns$ == null) return(false);
		if (this.constraint$ == null) return(false);
		if (this.constraint$.length == 0) return(false);

		let table:any[][] = this.constraint$;

		this.columns$.forEach((column) =>
		{values.push(record.getValue(column))})

		let match:boolean = false;
		for (let r = 0; r < table.length; r++)
		{
			match = true;
			let row:any[] = table[r];

			for (let c = 0; c < values.length; c++)
			{
				if (values[c] != row[c])
				{
					match = false;
					break;
				}
			}

			if (match)
				break;
		}

		return(match);
	}

	public asSQL() : string
	{
		if (this.subquery$ == null) return("subquery "+this.constraint$);
		return(this.subquery$)
	}

	public toString() : string
	{
		return(this.asSQL());
	}
}