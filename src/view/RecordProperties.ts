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

import { Row } from "./Row.js";
import { Field } from "./fields/Field.js";
import { Record } from "../model/Record.js";
import { BasicProperties } from "./fields/BasicProperties.js";
import { FieldFeatureFactory } from "./FieldFeatureFactory.js";

export class RecordProperties
{
	// record -> field -> clazz -> props
	propmap$:Map<object,Map<string,Map<string,BasicProperties>>> =
		new Map<object,Map<string,Map<string,BasicProperties>>>();

	public clear() : void
	{
		this.propmap$.clear();
	}

	public get(record:Record, field:string, clazz:string) : BasicProperties
	{
		return(this.propmap$.get(record.id)?.get(field)?.get(clazz));
	}

	public set(record:Record, field:string, clazz:string, props:BasicProperties) : void
	{
		let rmap:Map<string,Map<string,BasicProperties>> = this.propmap$.get(record.id);

		if (rmap == null)
		{
			rmap = new Map<string,Map<string,BasicProperties>>();
			this.propmap$.set(record.id,rmap);
		}

		let fmap:Map<string,BasicProperties> = rmap.get(field);

		if (fmap == null)
		{
			fmap = new Map<string,BasicProperties>();
			rmap.set(field,fmap);
		}

		fmap.set(clazz,props);
	}

	public delete(record:Record, field:string, clazz:string) : void
	{
		this.propmap$.get(record.id)?.get(field)?.delete(clazz);
	}

	public reset(row:Row, field?:string, clazz?:string) : void
	{
		if (row == null)
			return;

		if (field != null)
		{
			let fld:Field = row.getField(field);

			fld?.getInstances().forEach((inst) =>
			{
				if (clazz == null || inst.properties.hasClass(clazz))
					inst.resetProperties();
			})
		}
		else
		{
			row.getFields().forEach((fld) =>
			{
				fld.getInstances().forEach((inst) =>
				{
					if (clazz == null || inst.properties.hasClass(clazz))
						inst.resetProperties();
				})
			})
		}
	}

	public apply(row:Row, record:Record, field?:string) : void
	{
		let rmap:Map<string,Map<string,BasicProperties>> = this.propmap$.get(record.id);

		if (rmap == null)
			return;

		if (field != null)
		{
			let fmap:Map<string,BasicProperties> = rmap.get(field);

			if (fmap != null)
			{
				let fld:Field = row.getField(field);
				let classes:string[] = [...fmap.keys()];

				fld?.getInstances().forEach((inst) =>
				{
					for (let i = 0; i < classes.length; i++)
					{
						if (classes[i] == null || inst.properties.hasClass(classes[i]))
							FieldFeatureFactory.replace(fmap.get(classes[i]),inst,null);
					}
				})
			}
		}
		else
		{
			row.getFields().forEach((fld) =>
			{
				let fmap:Map<string,BasicProperties> = rmap.get(fld.name);

				if (fmap != null)
				{
					let classes:string[] = [...fmap.keys()];

					fld?.getInstances().forEach((inst) =>
					{
						for (let i = 0; i < classes.length; i++)
						{
							if (classes[i] == null || inst.properties.hasClass(classes[i]))
								FieldFeatureFactory.replace(fmap.get(classes[i]),inst,null);
						}
					})
				}
			});
		}
	}
}
