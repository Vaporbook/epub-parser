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
  throw "You must supply a URL to a valid EPUB file! Try this one, for War of the Worlds from Feedbooks: http://www.feedbooks.com/book/35.epub";
}

epubParser.open(process.argv[2], function (err, epubData) {

	if(err) return inspect(err);
	
  inspect(epubData.easy);
	
  //inspect(epubData.raw.json.ncx);


  // uncomment the following lines to run a test of the zip lib using the included test epub

  //var zip = epubParser.getZip();

  //var file = zip.file('OPS/main23.xml').asText();

  //inspect(file);

//  if(!file.match(/-/)) {
 //   throw "Corrupt xml file deflated from test epub. The sequence '—' is not found meaning UTF-8 was corrupted";
 // }

  //inspect(filestat);

  console.log('tests passed');


});
