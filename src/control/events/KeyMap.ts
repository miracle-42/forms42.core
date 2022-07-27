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

import { KeyCodes } from "./KeyCodes.js";
import { Class } from "../../types/Class.js";
import { BrowserEvent } from "../../view/BrowserEvent.js";

export class KeyMap
{
	public static copy:KeyMap = new KeyMap({key: 'c', ctrl: true});
	public static undo:KeyMap = new KeyMap({key: 'z', ctrl: true});
	public static paste:KeyMap = new KeyMap({key: 'v', ctrl: true});

	public static sysdate:KeyMap = new KeyMap({key: ' ', ctrl: true});

	public static enter:KeyMap = new KeyMap({key: KeyCodes.Enter});
	public static escape:KeyMap = new KeyMap({key: KeyCodes.Escape});

	public static pageup:KeyMap = new KeyMap({key: KeyCodes.ArrowUp, shift:true});
	public static pagedown:KeyMap = new KeyMap({key: KeyCodes.ArrowDown, shift:true});

	public static nextfield:KeyMap = new KeyMap({key: KeyCodes.Tab});
	public static prevfield:KeyMap = new KeyMap({key: KeyCodes.Tab, shift: true});

	public static prevrecord:KeyMap = new KeyMap({key: KeyCodes.ArrowUp});
	public static nextrecord:KeyMap = new KeyMap({key: KeyCodes.ArrowDown});

    public static prevblock:KeyMap = new KeyMap({key: KeyCodes.PageUp});
	public static nextblock:KeyMap = new KeyMap({key: KeyCodes.PageDown});


	private key$:string;
	private alt$:boolean;
	private ctrl$:boolean;
	private meta$:boolean;
	private shift$:boolean;

	private signature$:string = null;

	public constructor(def:KeyDefinition)
	{
		if (def.shift == null)
		{
			if (def.key == def.key.toUpperCase() && def.key != def.key.toLowerCase())
				def.shift = true;
		}

		this.key$ = def.key.toLowerCase();

		this.alt$ = (def.alt ? true : false);
		this.ctrl$ = (def.ctrl ? true : false);
		this.meta$ = (def.meta ? true : false);
		this.shift$ = (def.shift ? true : false);

		this.signature$ = ""+this.key$ + "|";

		this.signature$ += (this.alt$   ? 't' : 'f');
		this.signature$ += (this.ctrl$  ? 't' : 'f');
		this.signature$ += (this.meta$  ? 't' : 'f');
		this.signature$ += (this.shift$ ? 't' : 'f');
	}

	public get key() : string
	{
		return(this.key$);
	}

	public get alt() : boolean
	{
		return(this.alt$);
	}

	public get ctrl() : boolean
	{
		return(this.ctrl$);
	}

	public get meta() : boolean
	{
		return(this.meta$);
	}

	public get shift() : boolean
	{
		return(this.shift$);
	}

	public get signature() : string
	{
		return(this.signature$);
	}

	public toString() : string
	{
		let str:string = "";

		if (this.shift$) str += "shift|";
		if (this.ctrl$) str += "ctrl|";
		if (this.alt$) str += "alt|";
		if (this.meta$) str += "meta|";

		if (str.endsWith("|"))
			str = "mod: "+str.substring(0,str.length-1)+", ";

		str += "key: ["+this.key$+"]";

		return("{"+str+"}");
	}
}

export interface KeyDefinition
{
	key:string;
	alt?:boolean;
	ctrl?:boolean;
	meta?:boolean;
	shift?:boolean;
}

export class KeyMapping
{
	private static map:Map<string,KeyMap> = null;

	public static init() : void
	{
		KeyMapping.map = new Map<string,KeyMap>();

		Object.keys(KeyMap).forEach((mapped) =>
		{
			if (KeyMap[mapped] != null && (KeyMap[mapped] instanceof KeyMap))
				KeyMapping.add(KeyMap[mapped]);
		});
	}

	public static update(map:Class<KeyMap>) : void
	{
		Object.keys(map).forEach((mapped) =>
		{
			if (map[mapped] != null && (map[mapped] instanceof KeyMap))
			{
				let existing:KeyMap = KeyMapping.get(map[mapped].signature);

				if (existing == null) KeyMapping.add(map[mapped]);
				else map[mapped] = KeyMapping.get(map[mapped].signature);
			}
		});
	}

	public static add(keymap:KeyMap) : void
	{
		if (keymap != null && KeyMapping.map.get(keymap.signature) == null)
			KeyMapping.map.set(keymap.signature,keymap);
	}

	public static get(signature:string, validated?:boolean) : KeyMap
	{
		if (!validated)
			signature = KeyMapping.complete(signature);

		let key:KeyMap = KeyMapping.map.get(signature);

		if (key == null) key = KeyMapping.create(signature);
		return(key);
	}

	public static parseBrowserEvent(event:BrowserEvent) : KeyMap
	{
		if (event.key == null) return(null);
		let key:string = event.key.toLowerCase();

		let signature:string = key+"|";
		signature += event.alt ? 't' : 'f';
		signature += event.ctrl ? 't' : 'f';
		signature += event.meta ? 't' : 'f';
		signature += event.shift ? 't' : 'f';

		return(KeyMapping.get(signature,true));
	}

	private static complete(signature:string) : string
	{
		let pos:number = signature.indexOf('|');

		if (pos <= 0)
		{
			signature += "|";
			pos = signature.length - 1;
		}

		while(signature.length - pos < 5)
			signature += 'f';

		return(signature);
	}

	private static create(signature:string) : KeyMap
	{
		let pos:number = signature.indexOf('|');
		let key:string = signature.substring(0,pos);

		let a:string = signature.substring(pos+1,pos+2);
		let c:string = signature.substring(pos+2,pos+3);
		let m:string = signature.substring(pos+3,pos+4);
		let s:string = signature.substring(pos+4,pos+5);

		let def:KeyDefinition =
		{
			key: key,
			alt: (a == 't' ? true : false),
			ctrl: (c == 't' ? true : false),
			meta: (m == 't' ? true : false),
			shift: (s == 't' ? true : false),
		};

		let keymap:KeyMap = new KeyMap(def);
		KeyMapping.map.set(keymap.signature,keymap);

		return(keymap);
	}
}