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

import { Like } from "./Like.js";
import { ILike } from "./ILike.js";
import { Equals } from "./Equals.js";
import { AnyOff } from "./AnyOff.js";
import { Between } from "./Between.js";
import { LessThan } from "./LessThan.js";
import { Contains } from "./Contains.js";
import { SubQuery } from "./SubQuery.js";
import { NullFilter } from "./NullFilter.js";
import { GreaterThan } from "./GreaterThan.js";
import { DateInterval } from "./DateInterval.js";

export class Filters
{
	public static In(column:string) : AnyOff {return(new AnyOff(column))};
	public static Like(column:string) : Like {return(new Like(column))};
	public static ILike(column:string) : ILike {return(new ILike(column))};
	public static Equals(column:string) : Equals {return(new Equals(column))};
	public static Null(column:string) : NullFilter {return(new NullFilter(column))};
	public static Contains(columns:string|string[]) : Contains {return(new Contains(columns))};
	public static SubQuery(columns:string|string[]) : SubQuery {return(new SubQuery(columns))};
	public static DateInterval(column:string) : DateInterval {return(new DateInterval(column))};
	public static LT(column:string, incl?:boolean) : LessThan {return(new LessThan(column,incl))};
	public static Between(column:string, incl?:boolean) : Between {return(new Between(column,incl))};
	public static GT(column:string, incl?:boolean) : GreaterThan {return(new GreaterThan(column,incl))};
}