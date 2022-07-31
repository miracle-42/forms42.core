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

import { Field } from "./Field.js";
import { Status } from "../Row.js";
import { Form } from "../../public/Form.js";
import { FieldTypes } from "./FieldType.js";
import { Class } from "../../types/Class.js";
import { Display } from "./implementations/Display.js";
import { FieldProperties } from "./FieldProperties.js";
import { BrowserEvent as Event} from "../BrowserEvent.js";
import { Properties } from "../../application/Properties.js";
import { FieldFeatureFactory } from "../FieldFeatureFactory.js";
import { FieldEventHandler } from "./interfaces/FieldEventHandler.js";
import { FieldImplementation, FieldState } from "./interfaces/FieldImplementation.js";


export class FieldInstance implements FieldEventHandler
{
	private form$:Form = null;
	private field$:Field = null;
	private ignore$:string = null;
	private element$:HTMLElement = null;
	private impl:FieldImplementation = null;
	private properties$:FieldProperties = null;
	private defproperties$:FieldProperties = null;
	private insproperties$:FieldProperties = null;
	private qbeproperties$:FieldProperties = null;
	private clazz:Class<FieldImplementation> = null;

	constructor(form:Form,tag:HTMLElement)
	{
		this.form$ = form;
		this.properties$ = FieldFeatureFactory.consume(tag);
		this.field$ = Field.create(form,this.properties$.block,this.properties$.name,this.properties$.row);

		this.clazz = FieldTypes.get(tag.tagName,this.properties$.getAttribute("type"));

		this.impl = new this.clazz();
		this.impl.create(this,this.properties$.tag);

		this.properties.inst = this;

		this.defproperties$ = this.properties;
		this.insproperties$ = this.properties;
		this.qbeproperties$ = this.properties;

		this.element$ = this.impl.getElement();

		this.field$.addInstance(this);
	}

	public finalize() : void
	{
		FieldFeatureFactory.apply(this,this.properties$);
		this.impl.apply(this.properties$,true);
	}

	public updateDefaultProperties()
	{
		if (!this.hasDefaultProperties())
			return;

		let newprops:FieldProperties = this.defaultProperties;
		let clazz:Class<FieldImplementation> = FieldTypes.get(newprops.tag,newprops.type);

		if (clazz == this.clazz) this.updateField(newprops);
		else					 this.changeFieldType(clazz,newprops);
	}

	public resetProperties() : void
	{
		this.applyProperties(null);
	}

	public applyProperties(newprops:FieldProperties) : void
	{
		let change:boolean = false;

		if (newprops == null)
			newprops = this.defaultProperties;

		if (newprops != null)
		{
			if (newprops != this.properties)
				change = true;
		}
		else
		{
			newprops = this.defaultProperties;

			if (this.properties != this.defaultProperties)
				change = true;
		}

		if (newprops != this.properties)
			change = true;

		this.properties$ = newprops;

		if (change)
		{
			let clazz:Class<FieldImplementation> = FieldTypes.get(newprops.tag,newprops.type);

			if (clazz == this.clazz) this.updateField(newprops);
			else					 this.changeFieldType(clazz,newprops);
		}
	}

	private updateField(newprops:FieldProperties) : void
	{
		let value:any = null;
		let valid:boolean = this.valid;

		if (!this.field.dirty) value = this.impl.getValue();
		else				   value = this.impl.getIntermediateValue();

		this.impl.apply(newprops,false);
		FieldFeatureFactory.reset(this.element);
		FieldFeatureFactory.apply(this,newprops);

		this.valid = valid;

		if (!this.field.dirty) this.impl.setValue(value);
		else				   this.impl.setIntermediateValue(value);
	}

	private changeFieldType(clazz:Class<FieldImplementation>, newprops:FieldProperties) : void
	{
		let value:any = null;
		let valid:boolean = this.valid;

		if (!this.field.dirty) value = this.impl.getValue();
		else				   value = this.impl.getIntermediateValue();

		this.clazz = clazz;
		this.impl = new this.clazz();
		this.impl.create(this,newprops.tag);

		let before:HTMLElement = this.element;
		this.element$ = this.impl.getElement();
		FieldFeatureFactory.apply(this,newprops);

		this.impl.apply(newprops,true);
		before.replaceWith(this.element);

		this.valid = valid;

		if (!this.field.dirty) this.impl.setValue(value);
		else				   this.impl.setIntermediateValue(value);
	}

	public get row() : number
	{
		return(this.properties$.row);
	}

	public get form() : Form
	{
		return(this.form$);
	}

	public get id() : string
	{
		return(this.properties$.id);
	}

	public get name() : string
	{
		return(this.properties$.name);
	}

	public get block() : string
	{
		return(this.properties.block);
	}

	public get field() : Field
	{
		return(this.field$);
	}

	public get element() : HTMLElement
	{
		return(this.element$);
	}

	public get ignore() : string
	{
		return(this.ignore$);
	}

	public set ignore(value:string)
	{
		this.ignore$ = value;
	}

	public get valid() : boolean
	{
		let valid:boolean = true;

		this.element.classList.forEach((clazz) =>
		{
			if (clazz == Properties.Classes.Invalid)
				valid = false;
		})

		return(valid);
	}

	public set valid(flag:boolean)
	{
		if (!flag) this.element.classList.add(Properties.Classes.Invalid);
		else       this.element.classList.remove(Properties.Classes.Invalid);
	}

	public get properties() : FieldProperties
	{
		return(this.properties$);
	}

	public get defaultProperties() : FieldProperties
	{
		switch(this.field.row.status)
		{
			case Status.na:
				return(this.defproperties$);

			case Status.qbe:
				return(this.qbeproperties$);

			case Status.insert:
				return(this.insproperties$);

			case Status.update:
				return(this.defproperties$);
		}
	}

	public get qbeProperties() : FieldProperties
	{
		return(this.qbeproperties$);
	}

	public get updateProperties() : FieldProperties
	{
		return(this.defproperties$);
	}

	public get insertProperties() : FieldProperties
	{
		return(this.insproperties$);
	}

	public hasDefaultProperties() : boolean
	{
		switch(this.field.row.status)
		{
			case Status.na:
				return(this.properties == this.defproperties$);

			case Status.qbe:
				return(this.properties == this.qbeproperties$);

			case Status.insert:
				return(this.properties == this.insproperties$);

			case Status.update:
				return(this.properties == this.defproperties$);
		}
	}

	public clear() : void
	{
		this.impl.clear();
	}

	public getValue() : any
	{
		return(this.impl.getValue());
	}

	public setValue(value:any) : boolean
	{
		this.valid = true;
		this.field.valid = true;
		return(this.impl.setValue(value));
	}

	public getIntermediateValue() : string
	{
		return(this.impl.getIntermediateValue());
	}

	public setIntermediateValue(value:string) : void
	{
		this.valid = true;
		this.field.valid = true;
		this.impl.setIntermediateValue(value);
	}

	public blur() : void
	{
		this.impl.getElement().blur();
	}

	public focus() : void
	{
		this.impl.getElement().focus();
	}

	public focusable() : boolean
	{
		if (this.impl instanceof Display)
			return(false);

		return(this.properties.enabled);
	}

	public setFieldState(state:FieldState) : void
	{
		this.impl.setFieldState(state);
	}

	public async handleEvent(event:Event) : Promise<void>
	{
		return(this.field.handleEvent(this,event));
	}

	public toString() : string
	{
		return(this.name+"["+this.row+"]");
	}
}