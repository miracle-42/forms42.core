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

import { utils } from "./utils.js";
import { Alert } from "../../application/Alert.js";

export interface DateToken
{
	pos:number,
	length:number,
	mask:string,
	value:string,
	type:DatePart
}

export interface FormatToken
{
	pos:number,
	length:number,
	mask:string,
	type:DatePart,
	delimitor:string
}

export enum DatePart
{
	Date,
	Year,
	Month,
	Day,
	Hour,
	Minute,
	Second
}

export enum WeekDays
{
	Sun,
	Mon,
	Tue,
	Wed,
	Thu,
	Fri,
	Sat
}

export class dates
{
	public static validate() : boolean
	{
		let valid:boolean = true;
		let tokens:FormatToken[] = dates.tokenizeFormat();

		tokens.forEach((token) =>
		{
			if (token.type == null)
			{
				Alert.fatal("Format '"+token.mask+"' is not supported in default format","Date format")
				valid = false;
			}
		})

		return(valid);
	}

	public static parse(datestr:string, format?:string, withtime?:boolean) : Date
    {
		if (withtime == null)
			withtime = datestr.includes(' ');

        return(utils.parse(datestr,withtime,format));
    }

	public static getDays(start:WeekDays): Array<String>
	{
		let names:string[] = [];

		for (let i = 0; i < 7; i++)
			names.push(WeekDays[(i+start)%7])

		return(names);
	}

    public static format(date:Date, format?:string) : string
    {
        return(utils.format(date,format));
    }

    public static tokenizeDate(date:Date, format?:string) : DateToken[]
    {
        return(utils.tokenize(date,format));
    }

	public static getTokenType(token:string) : DatePart
	{
		switch(token)
		{
			case "DD": 	 return(DatePart.Day);
			case "MM": 	 return(DatePart.Month);
			case "YYYY": return(DatePart.Year);
			case "HH": 	 return(DatePart.Hour);
			case "mm": 	 return(DatePart.Minute);
			case "ss": 	 return(DatePart.Second);
			default  : 	 return(null);
		}
	}

    public static tokenizeFormat(format?:string) : FormatToken[]
    {
		let tokens:FormatToken[] = [];

        if (format == null)
			format = utils.full();

		let last:number = 0;
		let start:number = 0;
		let delim:string = utils.delim();

		for (let i = 0; i < format.length; i++)
		{
			if (delim.includes(format.charAt(i)))
			{
				if (i - last == 1)
				{
					Alert.fatal("Date delimitors can only be 1 character","Date delimitor");
					throw "@dates: Date delimitors can only be 1 character";
				}

				let token:FormatToken =
				{
					pos: start,
					length: i - start,
					delimitor: format.charAt(i),
					mask: format.substring(start,i),
					type: this.getTokenType(format.substring(start,i))
				}

				tokens.push(token);

				last = i;
				start = i + 1;
			}
		}

		tokens.push(
		{
			pos: start,
			delimitor: '',
			mask: format.substring(start),
			length: format.length - start,
			type: this.getTokenType(format.substring(start))
		});

		return(tokens);
    }
}