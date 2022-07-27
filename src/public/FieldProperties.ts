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

import { Form } from './Form.js';
import { Status } from '../view/Row.js';
import { Class } from '../types/Class.js';
import { DataMapper } from '../view/fields/DataMapper.js';
import { FieldInstance } from '../view/fields/FieldInstance.js';
import { BasicProperties } from '../view/fields/BasicProperties.js';
import { FieldFeatureFactory } from '../view/FieldFeatureFactory.js';


export class FieldProperties extends BasicProperties
{
	private status:Status = null;
	private inst$:FieldInstance = null;

	constructor(inst$:FieldInstance, deflt:boolean, status:Status)
	{
		super();
		this.inst$ = inst$;
		this.status = status;
		FieldFeatureFactory.initialize(this,inst$,deflt,status);
	}

	public get name() : string
	{
		return(this.inst$.name);
	}

	public get block() : string
	{
		return(this.inst$.block);
	}

	public get row() : number
	{
		if (this.inst$.row < 0) return(null);
		else 					return(this.inst$.row);
	}

	public get form() : Form
	{
		return(this.inst$.form);
	}

	public setTag(tag:string) : FieldProperties
	{
		this.tag = tag;
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
		super.setStyles(styles);
		return(this);
	}

	public setStyle(style:string, value:string) : FieldProperties
	{
		super.setStyle(style,value);
		return(this);
	}

	public removeStyle(style:string) : FieldProperties
	{
		super.removeStyle(style);
		return(this);
	}

	public setClass(clazz:any) : FieldProperties
	{
		super.setClass(clazz);
		return(this);
	}

	public removeClass(clazz:any) : FieldProperties
	{
		super.removeClass(clazz);
		return(this);
	}

	public setClasses(classes:string|string[]) : FieldProperties
	{
		super.setClasses(classes);
		return(this);
	}

	public setAttribute(attr:string, value:any) : FieldProperties
	{
		super.setAttribute(attr,value);
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

	public setValidValues(values: Set<string> | Map<string,string>) : FieldProperties
	{
		this.validValues = values;
		return(this);
	}

	public setMapper(mapper:Class<DataMapper>|DataMapper|string) : FieldProperties
	{
		super.setMapper(mapper);
		return(this);
	}

	public apply() : void
	{
		FieldFeatureFactory.merge(this,this.inst$,this.status == null);
	}
}
