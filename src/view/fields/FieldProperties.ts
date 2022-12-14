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

import { DataType } from "./DataType.js";
import { Class } from "../../types/Class.js";
import { DataMapper } from "./DataMapper.js";
import { FieldInstance } from "./FieldInstance.js";
import { BasicProperties } from "./BasicProperties.js";


export class FieldProperties extends BasicProperties
{
	private row$:number = -1;
	private id$:string = null;
	private name$:string = null;
	private block$:string = null;
	private inst$:FieldInstance = null;

	public get id() : string
	{
		return(this.id$);
	}

	public set id(id:string)
	{
		this.id$ = null;

		if (id != null)
		{
			this.id$ = id.trim().toLowerCase();
			if (this.id$.length == 0) this.id$ = null;
		}
	}

	public get type() : string
	{
		return(this.inst$.element.getAttribute("type"));
	}

	public get name() : string
	{
		return(this.name$);
	}

	public set name(name:string)
	{
		this.name$ = null;

		if (name != null)
		{
			this.name$ = name.trim().toLowerCase();
			if (this.name$.length == 0) this.name$ = null;
		}
	}

	public get block() : string
	{
		return(this.block$);
	}

	public set block(block:string)
	{
		this.block$ = null;

		if (block != null)
		{
			this.block$ = block.trim().toLowerCase();
			if (this.block$.length == 0) this.block$ = null;
		}
	}

	public get row() : number
	{
		return(this.row$);
	}

	public set row(row:number)
	{
		if (row < 0) this.row$ = -1;
		else		 this.row$ = row;
	}

	public get inst() : FieldInstance
	{
		return(this.inst$);
	}

	public set inst(inst:FieldInstance)
	{
		this.inst$ = inst;
	}

	public setTag(tag:string) : FieldProperties
	{
		this.tag = tag;
		return(this);
	}

	public setType(type:DataType) : FieldProperties
	{
		super.setType(type);
		return(this);
	}

	public setEnabled(flag:boolean) : FieldProperties
	{
		this.enabled = flag;
		return(this);
	}

	public setReadOnly(flag:boolean) : FieldProperties
	{
		this.readonly = flag;
		return(this);
	}

	public setRequired(flag:boolean) : FieldProperties
	{
		this.required = flag;
		return(this);
	}

	public setHidden(flag:boolean) : FieldProperties
	{
		this.hidden = flag;
		return(this);
	}

	public setStyles(styles:string) : FieldProperties
	{
		this.styles = styles;
		return(this);
	}

	public removeStyle(style:string) : FieldProperties
	{
		super.removeStyle(style);
		return(this);
	}

	public setClass(clazz:string) : FieldProperties
	{
		super.setClass(clazz);
		return(this);
	}

	public setClasses(classes:string|string[]) : FieldProperties
	{
		super.setClasses(classes);
		return(this);
	}

	public removeClass(clazz:any) : FieldProperties
	{
		super.removeClass(clazz);
		return(this);
	}

	public setAttribute(attr:string, value?:any) : FieldProperties
	{
		super.setAttribute(attr,value);
		return(this);
	}

	public setAttributes(attrs:Map<string,string>) : FieldProperties
	{
		super.setAttributes(attrs);
		return(this);
	}

	public removeAttribute(attr:string) : FieldProperties
	{
		super.removeAttribute(attr);
		return(this);
	}

	public setValue(value:string) : FieldProperties
	{
		this.value = value;
		return(this);
	}

    public setValidValues(values: string[] | Set<string> | Map<string,string>) : FieldProperties
	{
		this.validValues = values;
		return(this);
	}

	public setMapper(mapper:Class<DataMapper>|DataMapper|string) : FieldProperties
	{
		super.setMapper(mapper);
		return(this);
	}
}
