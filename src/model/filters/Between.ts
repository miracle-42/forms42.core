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


export class Between implements Filter
{
	private incl:boolean = false;

	private column$:string = null;
	private bindval$:string = null;
	private constraint$:any[] = null;
	private bindvalues$:BindValue[] = null;

	public constructor(column:string, incl?:boolean)
	{
		this.incl = incl;
		this.column$ = column;
		this.bindval$ = column;
	}

	public clear() : void
	{
		this.constraint$ = null;
	}

	public clone(): Between
	{
		let clone:Between = Reflect.construct(this.constructor,[this.column$]);
		clone.incl = this.incl;
		clone.bindval$ = this.bindval$;
		return(clone.setConstraint(this.constraint$));
	}

	public getBindValueName() : string
	{
		return(this.bindval$);
	}

	public setBindValueName(name:string) : Between
	{
		this.bindval$ = name;
		return(this);
	}

	public setConstraint(values:any[]) : Between
	{
		this.constraint = values;
		return(this);
	}

	public get constraint() : any|any[]
	{
		return(this.constraint$);
	}

	public set constraint(values:any[])
	{
		this.constraint$ = [];
		this.bindvalues$ = null;

		if (values == null) return;
		if (values.length != 2) return;

		this.constraint$ = values;
	}

	public getBindValue(): BindValue
	{
		return(this.getBindValues()[0]);
	}

	public getBindValues(): BindValue[]
	{
		if (this.bindvalues$ == null && this.constraint$ != null)
		{
			let b1:BindValue = new BindValue(this.bindval$+"0",this.constraint$[0]);
			let b2:BindValue = new BindValue(this.bindval$+"1",this.constraint$[1]);

			b1.column = this.column$;
			b2.column = this.column$;

			this.bindvalues$ = [b1,b2];
		}

		return(this.bindvalues$);
	}

	public async evaluate(record:Record) : Promise<boolean>
	{
		if (this.bindvalues$)
		{
			this.constraint$[0] = this.bindvalues$[0].value;
			this.constraint$[1] = this.bindvalues$[1].value;
		}

		if (this.column$ == null) return(false);
		if (this.constraint$ == null) return(false);
		let value:any = record.getValue(this.column$.toLowerCase());

		if (!this.incl)
		return(value > this.bindvalues$[0].value && value < this.bindvalues$[1].value);
		return(value >= this.bindvalues$[0].value && value <= this.bindvalues$[1].value);
	}

	public asSQL() : string
	{
		if (!this.constraint$ && !this.bindvalues$)
			return("1 = 2");

		let lt:string = "<";
		let gt:string = ">";

		if (this.bindval$ == null)
			this.bindval$ = this.column$;

		if (this.incl)
		{
			lt = "<=";
			gt = ">=";
		}

		let whcl:string = this.column$ + " " + gt + " :"+this.bindval$ + "0" +
								" and " +
								this.column$ + " " + lt + " :"+this.bindval$ + "1";

		return(whcl)
	}

	public toString() : string
	{
		return(this.asSQL());
	}
}