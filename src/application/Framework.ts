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

import { Alert } from './Alert.js';
import { Tag } from './tags/Tag.js';
import { Class } from '../types/Class.js';
import { Logger, Type } from './Logger.js';
import { Properties } from './Properties.js';
import { isFormField } from './tags/FormField.js';
import { ComponentFactory } from './interfaces/ComponentFactory.js';


export class Framework
{
    private component:any = null;
	private root:HTMLElement = null;
    private static taglib:Map<string,Tag> = null;
    private static attrlib:Map<string,Tag> = null;

    public eventhandler:EventHandler = null;
    public events:Map<Element,string[][]> = new Map<Element,string[][]>();

    private static initTaglib() : Map<string,Tag>
    {
		Framework.taglib = new Map<string,Tag>();
		Properties.getTagLibrary().forEach((clazz,tag) => {Framework.addTag(tag.toLowerCase(),clazz);});
		return(Framework.taglib);
    }

    private static initAttrlib() : Map<string,Tag>
    {
		Framework.attrlib = new Map<string,Tag>();
		Properties.getAttributeLibrary().forEach((clazz,tag) => {Framework.addAttr(tag.toLowerCase(),clazz);});
		return(Framework.attrlib);
    }

    public static addTag(tag:string,clazz:Class<Tag>) : void
    {
        tag = tag.toLowerCase();

        let factory:ComponentFactory = Properties.FactoryImplementationClass;
        let impl:Tag = factory.createBean(clazz);

        Framework.taglib.set(tag,impl);
    }

    public static addAttr(tag:string,clazz:Class<Tag>) : void
    {
        tag = tag.toLowerCase();

        let factory:ComponentFactory = Properties.FactoryImplementationClass;
        let impl:Tag = factory.createBean(clazz);

        Framework.attrlib.set(tag,impl);
    }

    public static parse(component:any, doc:Element) : Framework
    {
        return(new Framework(component,doc));
    }

	public static trim(element:HTMLElement) : HTMLElement
	{
		let remove:number[] = [];

		for(let i=0; i < element.childNodes.length; i++)
		{
			let node:Node = element.childNodes.item(i);
			if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() == "")
				remove.unshift(i);
		}

		for(let i=0; i < remove.length; i++)
			element.childNodes.item(remove[i]).remove();

		if (element.childNodes.length == 1)
			element = element.childNodes.item(0) as HTMLElement;

		return(element);
	}

    public static copyAttributes(fr:Element,to:Element) : void
    {
        if (fr == null || to == null) return;
        let attrnames:string[] = fr.getAttributeNames();

        for (let an = 0; an < attrnames.length; an++)
            to.setAttribute(attrnames[an],fr.getAttribute(attrnames[an]));
    }

    private constructor(component:any, doc:Element)
    {
        this.component = component;
        this.eventhandler = new EventHandler(component);

		if (Framework.taglib == null)
			Framework.taglib = Framework.initTaglib();

		if (Framework.attrlib == null)
			Framework.attrlib = Framework.initAttrlib();

        if (!Properties.ParseTags && !Properties.ParseEvents)
            return;

        this.parseDoc(doc);
        this.applyEvents();
    }

    public getRoot() : HTMLElement
    {
        return(this.root);
    }

    private parseDoc(doc:Element, form?:Element) : void
    {
        if (doc == null) return;
		let prefix:string = Properties.AttributePrefix;

		let nodes:Node[] = [];
		let inform:boolean = form != null;
		if (doc instanceof HTMLFormElement) form = doc;
		doc.childNodes.forEach((node) => {nodes.push(node)});

        for (let i = 0; i < nodes.length; i++)
        {
			let element:Node = nodes[i];
            if (!(element instanceof HTMLElement)) continue;

            let impl:Tag = null;
			let attr:string = null;
            let tag:string = element.nodeName.toLowerCase();

            if (Properties.ParseTags)
			{
				impl = Framework.taglib.get(tag);
				let attrnames:string[] = element.getAttributeNames();

				for (let an = 0; impl == null && an < attrnames.length; an++)
				{
					let atrnm:string = attrnames[an].toLowerCase();

					if (!Properties.RequireAttributePrefix)
					{
						impl = Framework.attrlib.get(atrnm);
						if (impl != null) attr = atrnm;
					}

					if (impl == null)
					{
						if (attrnames[an].startsWith(prefix))
						{
							atrnm = attrnames[an].substring(prefix.length).toLowerCase();
							impl = Framework.attrlib.get(atrnm);
							if (impl != null) attr = atrnm;
						}
					}
				}
			}

            if (impl != null)
            {
                let replace:HTMLElement|HTMLElement[]|string = impl.parse(this.component,element,attr);
                Logger.log(Type.htmlparser,"Resolved tag: '"+tag+"' using class: "+impl.constructor.name);

				if (form != null && isFormField(impl))
				{
					if (impl.editable)
						form.setAttribute("onsubmit","return false;");
				}

				if (replace == null)
                {
                    element.remove();
                    element = null;
                }
                else if (replace != element)
                {
                    if (typeof replace === "string")
                    {
                        let template:HTMLDivElement = document.createElement('div');
						template.innerHTML = replace;
						replace = Framework.trim(template);
                    }

					if (!Array.isArray(replace))
						replace = [replace];

					for(let r=0; r < replace.length; r++)
						replace[r] = doc.insertBefore(replace[r],element);

					element.remove();

					if (tag == Properties.RootTag)
						this.root = replace[0];

					for(let r=0; r < replace.length; r++)
						this.parseDoc(replace[r],form);
                }

                continue;
            }

            this.addEvents(element);
            this.parseDoc(element,form);
        }

		if (!inform) form = null;
    }

    private addEvents(element:Element) : void
    {
        if (element == null) return;
        if (!Properties.ParseEvents) return;
		let prefix:string = Properties.AttributePrefix;

        let attrnames:string[] = element.getAttributeNames();

        for (let an = 0; an < attrnames.length; an++)
        {
            let attrvalue:string = element.getAttribute(attrnames[an]);
            if (attrvalue != null) attrvalue = attrvalue.trim();

			if (!Properties.RequireAttributePrefix)
			{
				if (attrnames[an].toLowerCase().startsWith("on") && attrvalue.startsWith("this."))
				{
					let events:string[][] = this.events.get(element);

					if (events == null)
					{
						events = [];
						this.events.set(element,events);
					}

					events.push([attrnames[an],attrvalue]);
					element.removeAttribute(attrnames[an]);

					Logger.log(Type.eventparser,"Add event: '"+attrvalue+"' for: "+attrnames[an]);
					continue;
				}
			}

			if (!attrnames[an].startsWith(prefix))
				continue;

			attrnames[an] = attrnames[an].substring(prefix.length);
			attrnames[an] = attrnames[an].toLowerCase();

            if (attrvalue != null)
            {
                let events:string[][] = this.events.get(element);

                if (events == null)
                {
                    events = [];
                    this.events.set(element,events);
                }

                events.push([attrnames[an],attrvalue]);
                element.removeAttribute(attrnames[an]);

                Logger.log(Type.eventparser,"Add event: '"+attrvalue+"' for: "+attrnames[an]);
            }
        }
    }

    private applyEvents() : void
    {
        if (Properties.ParseEvents && this.component != null)
        {
            this.events.forEach((event,element) =>
            {
                for (let i = 0; i < event.length; i++)
                {
                    let func:DynamicCall = new DynamicCall(event[i][1]);
                    let ename:string = this.eventhandler.addEvent(element,event[i][0],func);
                    element.addEventListener(ename,this.eventhandler);
                }
            });
        }
    }

	public print(elem:HTMLElement) : void
	{
		console.log(elem.tagName);
		let attrs:string[] = elem.getAttributeNames();
		attrs.forEach((attr) => {console.log(attr+"="+elem.getAttribute(attr))});
	}
}


export class DynamicCall
{
    public path:string[];
    public method:string;
    public args:string[] = [];

    constructor(signature:string)
    {
        this.parse(signature);
    }

    private parse(signature:string) : void
    {
        if (signature.startsWith("this."))
            signature = signature.substring(5);

        let pos1:number = signature.indexOf("(");
        let pos2:number = signature.indexOf(")");

        this.path = signature.substring(0,pos1).split(".");
        let arglist:string = signature.substring(pos1+1,pos2).trim();

        let n:number = 0;
        let arg:string = "";
        let quote:string = null;
        this.method = this.path.pop();

        for(let i=0; i < arglist.length; i++)
        {
            let c:string = arglist.charAt(i);

            if (c == "," && quote == null)
            {
                if (arg.length > 0)
                {
                    this.args.push(arg);
                    n++;
                    arg = "";
                }

                continue;
            }

            if (c == "'" || c == '"')
            {
                if (quote != null && c == quote)
                {
                    n++;
                    quote = null;
                    continue;
                }

                else

                if (quote == null)
                {
                    quote = c;
                    continue;
                }
            }

            arg += c;
        }

        if (this.args.length < n)
            this.args.push(arg);
    }

    public invoke(component:any) : void
    {
        for(let i = 0; i < this.path.length; i++)
        {
            if (!component[this.path[i]])
			{
				let problem:string = "is null";
				if (!(this.path[i] in component)) problem = "does not exists";
				let msg:string = "@Framework: Attribute : '"+this.path[i]+"' on component: '"+component.constructor.name+"' "+problem;
				Alert.fatal(msg,"Invoke Method");
				return;
			}

            component = component[this.path[i]];
        }

        try
        {
            switch(this.args.length)
            {
                case 0: component[this.method](); break;
                case 1: component[this.method](this.args[0]); break;
                default: component[this.method](...this.args);
            }
        }
        catch (error)
        {
			let msg:string = "@Framework: Failed to invoke method: '"+this.method+"' on component: "+component.constructor.name;
			Alert.fatal(msg+" "+error,"Invoke Method");
        }
    }
}


class EventHandler implements EventListenerObject
{
    private events:Map<Element,Map<string,DynamicCall>> =
        new Map<Element,Map<string,DynamicCall>>();

    constructor(private component:any) {}

    public addEvent(element:Element,event:string,handler:DynamicCall) : string
    {
        if (event.startsWith("on")) event = event.substring(2);
        let events:Map<string,DynamicCall> = this.events.get(element);

        if (events == null)
        {
            events = new Map<string,DynamicCall>();
            this.events.set(element,events);
        }

        events.set(event,handler);
        return(event);
    }

    public getEvent(element:Element,event:string) : DynamicCall
    {
        let events:Map<string,DynamicCall> = this.events.get(element);
        if (events == null) return(null);
        return(events.get(event));
    }

    public handleEvent(event:Event): void
    {
        let elem:Element = event.target as Element;
        let method:DynamicCall = this.getEvent(elem,event.type);

        if (method == null)
        {
            while (method == null && elem.parentElement != document.body.parentElement)
            {
                elem = elem.parentElement;
                method = this.getEvent(elem,event.type);
            }
        }

        if (method != null) method.invoke(this.component);
        else
		{
			let msg:string = "@Framework: Cannot find "+event.type+" on this or parent any elements";
			Alert.fatal(msg,"Invoke Method");
		}
    }
}