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
import { DataMapper } from "./DataMapper.js";
import { Alert } from "../../application/Alert.js";
import { Class, isClass } from "../../types/Class.js";
import { Properties } from "../../application/Properties.js";
import { FormsModule } from "../../application/FormsModule.js";
import { ComponentFactory } from "../../application/ComponentFactory.js";


export interface Style
{
	style:string;
	value:string;
}

export class BasicProperties
{
	protected tag$:string = null;
	protected styles$:Style[] = [];
	protected classes$:string[] = [];
	protected mapper$:DataMapper = null;
	protected attribs$:Map<string,string> = new Map<string,string>();

	protected hidden$:boolean = false;
	protected enabled$:boolean = false;
	protected advquery$:boolean = true;
	protected derived$:boolean = false;
	protected readonly$:boolean = false;
	protected required$:boolean = false;

	protected value$:string = null;
	protected values$:Map<string,string> = new Map<string,string>();

	protected handled$:string[] = ["id","name",Properties.BindAttr,"row","invalid"];
	protected structured$:string[] = ["hidden","enabled","readonly","required","derived","advquery","value","class","style","mapper"];

	public get tag() : string
	{
		return(this.tag$);
	}

	public set tag(tag:string)
	{
		this.tag$ = tag?.toLowerCase();
	}

	public setTag(tag:string) : BasicProperties
	{
		this.tag = tag;
		return(this);
	}

	public get enabled() : boolean
	{
		return(this.enabled$);
	}

	public set enabled(flag:boolean)
	{
		this.enabled$ = flag;
	}

	public setEnabled(flag:boolean) : BasicProperties
	{
		this.enabled = flag;
		return(this);
	}

	public get readonly() : boolean
	{
		return(this.readonly$);
	}

	public set readonly(flag:boolean)
	{
		this.readonly$ = flag;
	}

	public setReadOnly(flag:boolean) : BasicProperties
	{
		this.readonly = flag;
		return(this);
	}

	public get required() : boolean
	{
		return(this.required$);
	}

	public set required(flag:boolean)
	{
		this.required$ = flag;
	}

	public get derived() : boolean
	{
		return(this.derived$);
	}

	public set derived(flag:boolean)
	{
		this.derived$ = flag;
	}

	public get advquery() : boolean
	{
		return(this.advquery$);
	}

	public set advquery(flag:boolean)
	{
		this.advquery$ = flag;
	}

	public setRequired(flag:boolean) : BasicProperties
	{
		this.required = flag;
		return(this);
	}

	public setDerived(flag:boolean) : BasicProperties
	{
		this.derived = flag;
		return(this);
	}

	public setAdvancedQuery(flag:boolean) : BasicProperties
	{
		this.advquery = flag;
		return(this);
	}

	public get hidden() : boolean
	{
		return(this.hidden$);
	}

	public set hidden(flag:boolean)
	{
		this.hidden$ = flag;
	}

	public setHidden(flag:boolean) : BasicProperties
	{
		this.hidden = flag;
		return(this);
	}

	public get styleElements() : Style[]
	{
		return(this.styles$);
	}

	public getStyles() : Style[]
	{
		return(this.styles$);
	}

	public setType(type:DataType) : BasicProperties
	{
		let date:boolean = this.hasClass("date");
		let datetime:boolean = this.hasClass("datetime");

		this.removeClass("date");
		this.removeClass("integer");
		this.removeClass("decimal");
		this.removeClass("datetime");

		switch(type)
		{
			case DataType.date :
			{
				if (!datetime) this.setClass("date");
				else 		   this.setClass("datetime");
			}
			break;

			case DataType.datetime :
			{
				if (date) this.setClass("date");
				else 	  this.setClass("datetime");
			}
			break;

			case DataType.integer : this.setClass("integer"); break;
			case DataType.decimal : this.setClass("decimal"); break;
		}

		return(this);
	}

	public get style() : string
	{
		let style:string = "";
		this.styles$.forEach((element) => {style += element.style+":"+element.value+";"});
		return(style)
	}

	public set styles(styles:string|Style[])
	{
		if (styles == null)
		{
			this.styles$ = [];
			return;
		}

		if (!(typeof styles === "string"))
		{
			this.styles$ = styles;
			return;
		}

		let elements:string[] = styles.split(";")

		for (let i = 0; i < elements.length; i++)
		{
			let element:string = elements[i].trim();

			if (element.length > 0)
			{
				let pos:number = element.indexOf(':');

				if (pos > 0)
				{
					let style:string = element.substring(0,pos).trim();
					let value:string = element.substring(pos+1).trim();

					this.setStyle(style,value);
				}
			}
		}
	}

	public setStyles(styles:string|Style[]) : BasicProperties
	{
		this.styles = styles;
		return(this);
	}

	public setStyle(style:string, value:string) : BasicProperties
	{
		value = value?.toLowerCase();
		style = style?.toLowerCase();

		this.removeStyle(style);
		this.styles$.push({style: style, value: value});

		return(this);
	}

	public removeStyle(style:string) : BasicProperties
	{
		style = style?.toLowerCase();

		for (let i = 0; i < this.styles$.length; i++)
		{
			if (this.styles$[i].style == style)
			{
				this.styles$.splice(i,1);
				break;
			}
		}

		return(this);
	}

	public setClass(clazz:string) : BasicProperties
	{
		if (clazz == null)
			return(this);

		clazz = clazz.trim();

		if (clazz.includes(' '))
		{
			this.setClasses(clazz);
			return(this);
		}

		clazz = clazz?.toLowerCase();

		if (!this.classes$.includes(clazz))
			this.classes$.push(clazz);

		return(this);
	}

	public setClasses(classes:string|string[]) : BasicProperties
	{
		this.classes$ = [];

		if (classes == null)
			return(this);

		if (!Array.isArray(classes))
			classes = classes.split(' ');

		for (let i = 0; i < classes.length; i++)
		{
			if (classes[i]?.length > 0)
				this.classes$.push(classes[i].toLowerCase());
		}

		return(this);
	}

	public getClasses() : string[]
	{
		return(this.classes$);
	}

	public hasClass(clazz:string) : boolean
	{
		clazz = clazz?.toLowerCase();
		return(this.classes$.includes(clazz));
	}

	public removeClass(clazz:any) : BasicProperties
	{
		clazz = clazz?.toLowerCase();
		let idx:number = this.classes$.indexOf(clazz);
		if (idx >= 0) this.classes$.splice(idx,1)
		return(this);
	}

	public getAttributes() : Map<string,string>
	{
		return(this.attribs$);
	}

	public setAttributes(attrs:Map<string,string>) : BasicProperties
	{
		this.attribs$ = attrs;
		return(this);
	}

	public getAttribute(attr:string) : string
	{
		return(this.attribs$.get(attr?.toLowerCase()));
	}

	public setAttribute(attr:string, value?:any) : BasicProperties
	{
		attr = attr?.toLowerCase();

		if (this.handled$.includes(attr))
			return(this);

		if (this.structured$.includes(attr))
		{
			let flag:boolean = true;

			if (value != null && value.toLowerCase() == "false")
				flag = false;

			switch(attr)
			{
				case "value": this.value$ = value; break;
				case "hidden": this.hidden = flag; break;
				case "enabled": this.enabled = flag; break;
				case "derived": this.derived = flag; break;
				case "advquery": this.advquery = flag; break;
				case "readonly": this.readonly = flag; break;
				case "required": this.required = flag; break;

				case "style": this.setStyles(value); break;
				case "class": this.setClasses(value); break;

				case "mapper": this.setMapper(value); break;
			}

			return(this);
		}

		let val:string = "";
		attr = attr?.toLowerCase();

		if (value != null)
			val += value;

		this.attribs$.set(attr,val);
		return(this);
	}

	public removeAttribute(attr:string) : BasicProperties
	{
		attr = attr?.toLowerCase();
		this.attribs$.delete(attr);

		switch(attr)
		{
			case "value": this.value$ = null; break;
			case "hidden": this.hidden = false; break;
			case "enabled": this.enabled = false; break;
			case "derived": this.derived = false; break;
			case "advquery": this.advquery = true; break;
			case "readonly": this.readonly = false; break;
			case "required": this.required = false; break;

			case "style": this.setStyles(null); break;
			case "class": this.setClasses(null); break;

			case "mapper": this.setMapper(null); break;
		}

		return(this);
	}

	public get value() : string
	{
		return(this.value$);
	}

	public set value(value:string)
	{
		this.value$ = null;

		if (value != null)
		{
			this.value$ = value.trim();
			if (this.value$.length == 0)
				this.value$ = null;
		}
	}

	public setValue(value:string) : BasicProperties
	{
		this.value = value;
		return(this);
	}


	 public get validValues() : Map<string,string>
	{
		return(this.values$);
	 }

	 public set validValues(values: string[] | Set<string> | Map<string,string>)
	{
		if (Array.isArray(values) || values instanceof Set)
		{
			this.values$ = new Map<string,string>();
			values.forEach((value:string) => {this.values$.set(value,value)});
		}
		else this.values$ = values;
	 }

	 public setValidValues(values: string[] | Set<string> | Map<string,string>) : BasicProperties
	{
		this.validValues = values;
		return(this);
	}

	 public getValidValues() : Map<string,string>
	{
		return(this.values$);
	 }

	public get mapper() : DataMapper
	{
		return(this.mapper$);
	}

	public set mapper(mapper:DataMapper)
	{
		this.mapper$ = mapper;
	}

	public setMapper(mapper:Class<DataMapper>|DataMapper|string) : BasicProperties
	{
		let factory:ComponentFactory =
			Properties.FactoryImplementation;

		if (typeof mapper === "string")
			mapper = FormsModule.get().getComponent(mapper);

		if (isClass(mapper))
			this.mapper$ = factory.createBean(mapper) as DataMapper;

		if (this.mapper$ != null && !("getIntermediateValue" in this.mapper$))
		{
			Alert.fatal("'"+this.mapper$.constructor.name+"' is not a DataMapper","DataMapper");
			this.mapper$ = null;
		}

		return(this);
	}
}
