var epubParser = require('../lib/epub-parser');
var inspect = require('eyes').inspector({

	styles: {
      
      special: 'green',      // null, undefined...
      string:  'grey',
      number:  'magenta',
      bool:    'blue',      // true false
      regexp:  'green'
         // /\d+/

  	},
	maxLength: false
});

if(!process.argv[2]) {
  throw "You must supply a path to a valid EPUB file!";
}

epubParser.open(process.argv[2], function (err, epubData) {

	if(err) return console.log(err);
	inspect(epubData.easy);
	inspect(epubData.raw.json.ncx);

});

