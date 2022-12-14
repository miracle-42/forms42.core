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

import { SQLRest } from "./SQLRest.js";
import { DataType } from "./DataType.js";
import { Connection } from "./Connection.js";
import { Alert } from "../application/Alert.js";
import { SQLRestBuilder } from "./SQLRestBuilder.js";
import { Parameter, ParameterType } from "./Parameter.js";
import { DatabaseConnection } from "../public/DatabaseConnection.js";

export class StoredProcedure
{
	private name$:string;
	private response$:any = null;
	private patch$:boolean = false;
	private message$:string = null;
	private conn$:Connection = null;
	private params$:Parameter[] = [];
	private values$:Map<string,any> = new Map<string,any>();
	private datetypes$:DataType[] = [DataType.date, DataType.datetime, DataType.timestamp];

	protected retparm$:string = null;
	protected returntype$:DataType|string = null;

	public constructor(connection:DatabaseConnection)
	{

		if (connection == null)
		{
			Alert.fatal("Cannot create stored procedure when connection is null",this.constructor.name);
			return;
		}

		this.conn$ = connection["conn$"];
	}

	public set patch(flag:boolean)
	{
		this.patch$ = flag;
	}

	public error() : string
	{
		return(this.message$);
	}

	public setName(name:string) : void
	{
		this.name$ = name;
	}

	public addParameter(name:string, value:any, datatype?:DataType|string, paramtype?:ParameterType) : void
	{
		let param:Parameter = new Parameter(name,value,datatype,paramtype);
		this.params$.push(param);
	}

	public getOutParameter(name:string) : any
	{
		return(this.values$.get(name?.toLowerCase()));
	}

	public getOutParameterNames() : string[]
	{
		return([...this.values$.keys()]);
	}

	public async execute() : Promise<boolean>
	{
		let value:any = null;
		let name:string = null;
		let dates:string[] = [];
		let names:string[] = null;
		let unique:boolean = false;
		let retparam:Parameter = null;

		if (this.returntype$ != null)
		{
			this.retparm$ = "retval";

			while(!unique)
			{
				unique = true;

				for (let i = 0; i < this.params$.length; i++)
				{
					if (this.params$[i].name == this.retparm$)
					{
						unique = false;
						this.retparm$ += "0";
					}
				}
			}

			retparam = new Parameter(this.retparm$,null,this.returntype$,ParameterType.out);
		}

		let sql:SQLRest = SQLRestBuilder.proc(this.name$,this.params$,retparam);
		this.response$ = await this.conn$.call(this.patch$,sql);

		if (!this.response$.success)
		{
			this.message$ = this.response$.message;
			return(false);
		}

		if (this.returntype$ != null)
			this.params$.unshift(retparam);

		names = Object.keys(this.response$);

		this.params$.forEach((param) =>
		{
			let bn:string = param.name?.toLowerCase();
			let dt:DataType = DataType[param.dtype?.toLowerCase()];

			if (this.datetypes$.includes(dt))
				dates.push(bn)
		})

		for (let i = 1; i < names.length; i++)
		{
			name = names[i].toLowerCase();
			value = this.response$[names[i]];

			if (dates.includes(name))
				value = new Date(value);

			this.values$.set(name,value);
		}

		return(true);
	}
}