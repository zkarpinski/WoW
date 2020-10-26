/*
	Beeq's Ultimate Macro Set Generator
	usage example:
	node .\generateMacroSet.js ALL Warlock Affliction > blablahh.txt
	node .\generateMacroSet.js AST Monk Mistweaver > blablahh.txt
	node .\generateMacroSet.js ASTCNP Demon-Hunter Havoc > blablahh.txt

	T - Talents
	P - PVP
	S - Specialization
	A - Abilities
	C - Covenant Abilities
	N - Anima Powers
	ALL - All of the above

	Changelog
	1.01 -	added searches for Covenant Abilities and Anima Powers
	1.02 -	added various key codes ( pg up, pg dn, home, end, insert. delete, f1-f9 ) for not running out modifiers
		added exclamation marks into the macros. /cast Greater Invisibility -> /cast !Greater Invisibility
*/

const version = '1.02';

const debug = 0;
const axios = require('axios');
const colors = require('colors');

const classChoices = [
	'death-knight', 'demon-hunter', 'druid', 'hunter', 'mage', 'monk', 
	'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'
].sort();
const specChoices = [
	'blood', 'frost', 'unholy', 'havoc', 'vengeance', 'restoration', 'guardian',
	'feral', 'balance', 'beast-mastery', 'marksmanship', 'survival', 'arcane', 'fire',
	'brewmaster', 'mistweaver', 'windwalker', 'holy', 'protection', 'retribution',
	'discipline', 'shadow', 'assassination', 'outlaw', 'subtlety', 'elemental',
	'enhancement', 'affliction', 'demonology', 'destruction', 'arms', 'fury'
].sort();

var arr = [];
var args = process.argv.slice(2);

if (args.length < 3) {
	printUsage();
	console.error("Required parameters missing: Options, Class, Spec".bold.red);
	process.exitCode = 1;
}
else {
	var options = args[0].toLowerCase();
	var cls = args[1].toLowerCase(); 
	var spec = args[2];
	var keys = "full";
	if(args[3]) {
		keys = args[3].toLowerCase();	
	}

	if(classChoices.indexOf(cls) < 0 || specChoices.indexOf(spec) < 0) {
		printUsage();
		console.error("Class and Spec required as parameter 2 and 3".bold.red);
		process.exitCode = 1;
	}
	else {
		main(options, cls, spec, keys);
	}
}


function printUsage() {
	console.clear();
	console.error("Beeq's Ultimate Macro Set Generator".bold.cyan);
	console.error("node .\\generateMacroSet.js ".white + "(options) (class) (spec)".yellow + " [key-options]".green + " > your-file-name.xml".white);
	console.error("");
	console.error("usage examples:".cyan);
	console.error("node .\\generateMacroSet.js ALL Warlock Affliction > warlock-affliction.xml".gray);
	console.error("node .\\generateMacroSet.js AST Monk Mistweaver NOFUNC > monk-mistweaver.xml".gray);
	console.error("node .\\generateMacroSet.js ASTCNP Demon-Hunter Havoc > dh-havoc.xml".gray);
	console.error("");
	console.error("--- OPTIONS (Required) ---".yellow);
	console.error("T - Talents".gray);
	console.error("P - PVP".gray);
	console.error("S - Specialization".gray);
	console.error("A - Abilities".gray);
	console.error("C - Covenant Abilities".gray);
	console.error("N - Anima Powers".gray);
	console.error("ALL - All of the above".gray);
	console.error("");
	console.error("If selecting specific types of skills, combine individual characters (i.e. TSA, TPSA, TSACN)".white);
	console.error("Use ".white + "ALL".yellow + " to include all skills".white);
	console.error("");
	console.error("--- CLASSES (Required) ---".yellow);
	console.error(classChoices.join(", ").gray);
	console.error("");
	console.error("--- SPECS (Required) ---".yellow);
	console.error(specChoices.join(", ").gray);
	console.error("");
	console.error("--- Key Options (Optional) ---".green);
	console.error("Leave blank to use modifiers (ctrl,alt,shift) with the following keys: ".gray);
	console.error("NUM keys, F1-F9, INS, DEL, HOME, END, PGUP, PGDN".gray);
	console.error("");
	console.error("Pass NOFUNC to exclude the F1-F9 keys.".gray);
	console.error("");

}

function main(options, cls, spec, keyOptions) {
	var tasks = 0;
	if(options == "ALL") { options = "astcnp"; }
	if(options.indexOf("a") >= 0) { new Magic ( 'abilities' ); }
	if(options.indexOf("s") >= 0) { new Magic ( 'specialization' ); }
	if(options.indexOf("t") >= 0) { new Magic ( 'talents' ); }
	if(options.indexOf("c") >= 0) { new Magic ( 'covenant-abilities' ); }
	if(options.indexOf("n") >= 0) { new Magic ( 'anima-powers' ); }
	if(options.indexOf("p") >= 0) { new Magic ( 'pvp-talents' ); }

	function Magic( type )
	{
		++tasks;
		let url = 'https://www.wowhead.com/spells/' + type + '/' + cls;

		// Abilities do not require a spec subcategory
		if (spec && (type.indexOf('abilities') >= 0 || type.indexOf('anima' >= 0))) {
			url += '/' + spec.toLowerCase();
		}
		
		url += '?filter=50;2;0#0+1+20';
		if ( debug )
		{
			console.log ( url );
		}

		axios.get( url ).then( function ( response ) {

		let res = response.data;
		res = res.split('var listviewspells =')[1];
		res = res.split('new Listview')[0];
		res = res.trim().slice(0,-1);
		res = res.replace(/popularity/g,'"popularity"');
		res = res.replace(/frommerge/g,'"frommerge"');
		res = res.replace(/"quality"/g,'quality');
		res = res.replace(/quality/g,'"quality"');
		

		if ( debug )
		{
			console.log ( res );
			console.log ( '--------------------------------------------------------------------------------------------------' );
		}


		JSON.parse ( res ).forEach ( function ( r )
		{
			if ( ! arr.filter ( x => x === r.name ).length )
			{
				if ( r.name.indexOf("Portal:") < 0 )
				{
					if ( r.name.indexOf("Teleport:") < 0 )
					{
						arr.push ( r.name );
					}
				}
			}
		});

		--tasks;
		if ( tasks == 0 )
		{
			const C = new Carousel();

			arr.sort();
			let output = '<?xml version="1.0" encoding="utf-8"?><Box xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><ObjectType>ISBoxer_Toolkit.Configs.WoWMacroSet</ObjectType><SerializedObject>&lt;?xml version="1.0" encoding="utf-8"?&gt;&lt;WoWMacroSet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"&gt;&lt;Name&gt;bumg-' + cls + '-' + spec + '&lt;/Name&gt;&lt;Description&gt;generated with Beeq\'s Ultimate Macro Set Generator v' + version + '&lt;/Description&gt;&lt;WoWMacros&gt;';
			arr.forEach ( function ( ability )
			{
				output += '&lt;WoWMacro&gt;&lt;MacroCommands&gt;/cast [nochanneling] !' + ability + '&lt;/MacroCommands&gt;&lt;ColloquialName&gt;' + ability + '&lt;/ColloquialName&gt;&lt;Combo&gt;&lt;Combo&gt;&lt;/Combo&gt;';
				output += '&lt;Modifiers&gt;' + C.modifiers() + '&lt;/Modifiers&gt;';
				output += '&lt;Key&gt;&lt;Key&gt;&lt;/Key&gt;&lt;Code&gt;' + C.keyCode() + '&lt;/Code&gt;&lt;/Key&gt;&lt;/Combo&gt;&lt;AllowCustomModifiers /&gt;&lt;/WoWMacro&gt;';
				C.nextKey();
			});
			output += '&lt;/WoWMacros&gt;&lt;/WoWMacroSet&gt;</SerializedObject></Box>';
			console.log ( output );
		}

		}).catch(function (error) {
			console.log( "This is general and very useful error message" );
		});
	}

	function Carousel()
	{
		var self = this;

		this.keys = [];
		this.keyIndex = 0;
		this.modIndex = 0;

		new Key ( 82 );  // num pad 0
		new Key ( 79 );  // num pad 1
		new Key ( 80 );  // num pad 2
		new Key ( 81 );  // num pad 3
		new Key ( 75 );  // num pad 4
		new Key ( 76 );  // num pad 5
		new Key ( 77 );  // num pad 6
		new Key ( 71 );  // num pad 7
		new Key ( 72 );  // num pad 8
		new Key ( 73 );  // num pad 9
		new Key ( 55 );  // num pad *
		new Key ( 74 );  // num pad -
		new Key ( 78 );  // num pad +
		new Key ( 83 );  // num pad ,
		new Key ( 309 ); // num pad /
		new Key ( 329 ); // pg up
		new Key ( 337 ); // pg dn
		new Key ( 327 ); // home
		new Key ( 335 ); // end
		new Key ( 338 ); // insert
		new Key ( 339 ); // delete
		if (keyOptions != "nofunc") {
			new Key ( 59 ); // F1
			new Key ( 60 ); // F2
			new Key ( 61 ); // F3
			new Key ( 62 ); // F4
			new Key ( 63 ); // F5
			new Key ( 64 ); // F6
			new Key ( 65 ); // F7
			new Key ( 66 ); // F8
			new Key ( 67 ); // F9
		}

		function Key( code )
		{
			this.code = code;
			self.keys.push ( this );
		}

		this.nextKey = function()
		{
			++self.keyIndex;

			if ( self.keyCode() == 339 && self.modIndex == 2 ) { ++self.keyIndex; } // skip Ctrl+Alt+Del
			// if ( self.keyCode() == 339 && self.modIndex == 6 ) { ++self.keyIndex; } // skip Ctrl+Shift+Alt+Del

			self.keyIndex = self.keyIndex % self.keys.length;
			if ( self.keyIndex == 0 ) { ++self.modIndex }
		}

		this.keyCode = function()
		{
			let code;
			try
			{
				code = self.keys[ self.keyIndex ].code;
			}
			catch ( e )
			{
				code = self.keys[ 0 ].code;
			}	
			return code;
		}

		this.modifiers = function()
		{
			switch ( self.modIndex )
			{
				case 0: return 'Ctrl';
				case 1: return 'Ctrl Shift';
				case 2: return 'Ctrl Alt';
				case 3: return 'Shift Alt';
				case 4: return 'Alt';
				case 5: return 'Shift';
				case 6: return 'Ctrl Shift Alt';
			}
		}
	}

}

