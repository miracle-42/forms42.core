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


export class ILike implements Filter
{
	private column$:string = null;
	private bindval$:string = null;
	private ltrunc:boolean = false;
	private rtrunc:boolean = false;
	private parsed:boolean = false;
	private constraint$:string = null;
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

	public clone(): ILike
	{
		let clone:ILike = Reflect.construct(this.constructor,[this.column$]);
		clone.bindval$ = this.bindval$;
		return(clone.setConstraint(this.constraint$));
	}

	public getBindValueName() : string
	{
		return(this.bindval$);
	}

	public setBindValueName(name:string) : ILike
	{
		this.bindval$ = name;
		return(this);
	}

	public setConstraint(value:any) : ILike
	{
		this.constraint = value;
		return(this);
	}

	public get constraint() : string
	{
		let constr:string = this.constraint$;

		if (this.parsed)
		{
			if (this.ltrunc) constr = "%"+constr;
			if (this.rtrunc) constr = constr+"%";
		}

		return(constr);
	}

	public set constraint(value:string)
	{
		this.bindvalues$ = null;
		this.constraint$ = value;
	}

	public getBindValue(): BindValue
	{
		return(this.getBindValues()[0]);
	}

	public getBindValues(): BindValue[]
	{
		if (this.bindvalues$ == null)
		{
			this.bindvalues$ = [new BindValue(this.bindval$,this.constraint$)];
			this.bindvalues$[0].column = this.column$;
		}

		return(this.bindvalues$);
	}

	public async evaluate(record:Record) : Promise<boolean>
	{
		if (this.bindvalues$)
			this.constraint$ = this.bindvalues$[0].value;

		if (this.column$ == null) return(false);
		if (this.constraint$ == null) return(false);

		if (!this.parsed)
		{
			this.parsed = true;
			this.constraint$ = this.constraint$?.toLocaleLowerCase();

			if (this.constraint$?.endsWith("%")) this.rtrunc = true;
			if (this.constraint$?.startsWith("%")) this.ltrunc = true;

			if (this.ltrunc) this.constraint$ = this.constraint$.substring(1);
			if (this.rtrunc) this.constraint$ = this.constraint$.substring(0,this.constraint$.length-1);
		}


		let value:any = record.getValue(this.column$.toLocaleLowerCase());

		if (value == null)
			return(false);

		value = (value+"").toLocaleLowerCase();

		if (this.rtrunc && this.ltrunc)
		{
			if (value.includes(this.constraint$)) return(true);
			return(false);
		}

		if (this.rtrunc)
		{
			if (value.startsWith(this.constraint$)) return(true);
			return(false);
		}

		if (this.ltrunc)
		{
			if (value.endsWith(this.constraint$)) return(true);
			return(false);
		}

		return(value == this.constraint$);
	}

	public asSQL() : string
	{
		if (!this.constraint$ && !this.bindvalues$)
			return("1 = 2");

		if (this.bindval$ == null)
			this.bindval$ = this.column$;

		return(this.column$ + " ilike :"+this.bindval$)
	}

	public toString() : string
	{
		return(this.column$+" ilike "+this.constraint);
	}
}