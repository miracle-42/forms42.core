export enum Type
{
	metadata,
	database,
	htmlparser,
	eventparser,
	classloader,
	formbinding,
	eventhandling,
	eventlisteners,
}

export class Logger
{
	public static all:boolean = false;
	public static metadata:boolean = false;
	public static database:boolean = false;
	public static htmlparser:boolean = false;
	public static eventparser:boolean = false;
	public static classloader:boolean = false;
	public static formbinding:boolean = false;
	public static eventhandling:boolean = false;
	public static eventlisteners:boolean = false;

	public static log(type:Type, msg:string) : void
	{
		let flag:string = Type[type];
		if (Logger[flag] || Logger.all) console.log(msg);
	}
}