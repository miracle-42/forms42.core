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


export class Contains implements Filter
{
	private columns$:string[] = [];
	private bindval$:string = null;
	private constraint$:string[] = null;
	private bindvalues$:BindValue[] = null;

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
			this.bindval$ += "_"+columns[i];
	}

	public clear() : void
	{
		this.constraint$ = null;
	}

	public clone(): Contains
	{
		let clone:Contains = Reflect.construct(this.constructor,this.columns$);
		clone.bindval$ = this.bindval$;
		return(clone.setConstraint(this.constraint$));
	}

	public getBindValueName() : string
	{
		return(this.bindval$);
	}

	public setBindValueName(name:string) : Filter
	{
		this.bindval$ = name;
		return(this);
	}

	public setConstraint(values:any) : Contains
	{
		this.constraint = values;
		return(this);
	}

	public get constraint() : string|string[]
	{
		return(this.constraint$);
	}

	public set constraint(values:string|string[])
	{
		this.constraint$ = [];
		this.bindvalues$ = null;

		if (values == null)
			return;

		if (!Array.isArray(values))
			values = values.split(" ")

		for (let i = 0; i < values.length; i++)
		{
			if (values[i].length > 0)
				this.constraint$.push(values[i].trim().toLocaleLowerCase());
		}
	}

	public getBindValue(): BindValue
	{
		return(this.getBindValues()[0]);
	}

	public getBindValues(): BindValue[]
	{
		if (this.bindvalues$ == null)
		{
			let str = "";

			if (this.constraint$ != null)
			{
				for (let i = 0; i < this.constraint$.length; i++)
				{
					str += this.constraint$[i];

					if (i < this.constraint$.length - 1)
						str += " ";
				}
			}

			this.bindvalues$ = [new BindValue(this.bindval$,str)];
		}

		return(this.bindvalues$);
	}

	public async evaluate(record:Record) : Promise<boolean>
	{
		let value:string = "";

		if (this.bindvalues$)
			this.constraint$ = this.bindvalues$[0].value;

		if (this.constraint$ == null) return(false);

		for (let c = 0; c < this.columns$.length; c++)
			value += " " +  record.getValue(this.columns$[c]?.toLowerCase());

		value = value.toLocaleLowerCase();

		for (let c = 0; c < this.constraint$.length; c++)
			if (!value.includes(this.constraint$[c])) return(false);

		return(true);
	}

	public asSQL() : string
	{
		return(this.columns$+" contains "+this.constraint$);
	}
}