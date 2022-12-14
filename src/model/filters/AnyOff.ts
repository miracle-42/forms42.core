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


export class AnyOff implements Filter
{
	private column$:string = null;
	private bindval$:string = null;
	private constraint$:any[] = null;
	private bindvalues$:BindValue[] = null;

	public constructor(column:string)
	{
		this.column$ = column;
		this.bindval$ = column;
	}

	public clear() : void
	{
		this.constraint$ = null;
	}

	public clone(): AnyOff
	{
		let clone:AnyOff = Reflect.construct(this.constructor,[this.column$]);
		clone.bindval$ = this.bindval$;
		return(clone.setConstraint(this.constraint$));
	}

	public getBindValueName() : string
	{
		return(this.bindval$);
	}

	public setBindValueName(name:string) : AnyOff
	{
		this.bindval$ = name;
		return(this);
	}

	public setConstraint(values:any|any[]) : AnyOff
	{
		this.constraint = values;
		return(this);
	}

	public get constraint() : any|any[]
	{
		return(this.constraint$);
	}

	public set constraint(table:any|any[])
	{
		this.constraint$ = null;
		this.bindvalues$ = null;

		if (table == null)
			return;

		// Single value
		if (!Array.isArray(table))
			table = [table];

		if (table.length == 0)
			return;

		this.constraint$ = table;
	}

	public getBindValue(): BindValue
	{
		return(this.getBindValues()[0]);
	}

	public getBindValues(): BindValue[]
	{
		if (this.bindvalues$ == null)
		{
			this.bindvalues$ = [];

			if (this.constraint$.length > 5)
				return([]);

			for (let i = 0; i < this.constraint$.length; i++)
				this.bindvalues$.push(new BindValue(this.bindval$+"_"+i,this.constraint$[i]));

			this.bindvalues$.forEach((b) => b.column = this.column$);
		}

		return(this.bindvalues$);
	}

	public async evaluate(record:Record) : Promise<boolean>
	{
		let value:any = null;

		if (this.bindvalues$)
		{
			this.constraint$ = [];
			this.bindvalues$.forEach((b) => this.constraint$.push(b.value))
		}

		if (this.column$ == null) return(false);
		if (this.constraint$ == null) return(false);
		if (this.constraint$.length == 0) return(false);

		let match:boolean = false;
		let table:any[] = this.constraint$;
		value = record.getValue(this.column$);

		for (let c = 0; c < table.length; c++)
		{
			if (value == table[c])
			{
				match = true;
				break;
			}
		}

		return(match);
	}

	public asSQL() : string
	{
		if (!this.constraint$ && !this.bindvalues$)
			return("1 == 2");

		let whcl:string = this.column$ + " in (";

		if (this.constraint$.length > 5)
		{
			for (let i = 0; i < this.constraint$.length; i++)
			{
				whcl += this.quoted(this.constraint$[i])
				if (i < this.constraint$.length - 1) whcl += ","
			}
		}
		else
		{
			for (let i = 0; i < this.constraint$.length; i++)
			{
				whcl += ":"+this.bindval$+"_"+i;
				if (i < this.constraint$.length - 1) whcl += ","
			}
		}

		whcl += ")"
		return(whcl)
	}

	public toString(lenght?:number) : string
	{
		if (lenght == null)
			lenght = 30;

		if (this.constraint$ == null)
			return("1 = 2");

		let whcl:string = this.column$ + " in (";

		for (let i = 0; i < this.constraint$.length; i++)
		{
			whcl += this.quoted(this.constraint$[i])
			if (i < this.constraint$.length - 1) whcl += ","

			if (whcl.length > lenght-4)
			{
				whcl += "...";
				break
			}
		}
		whcl += ")"
		return(whcl);
	}

	private quoted(value:any) : any
	{
		if (typeof value == "string")
			return("'"+value+"'");

		if (value instanceof Date)
			return(value.getTime());

		return(value);
	}
}