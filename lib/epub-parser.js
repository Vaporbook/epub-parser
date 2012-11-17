var EpubParser;
//var sax = require('./sax');
require('node-zip');
var xml2js = require('xml2js');
var fs = require('fs');
var zip, zipEntries;
var epubdata = {};
var md5hash;
var htmlNav;


EpubParser = (function() {



	function open(filename, cb) {

		htmlNav = '<ul>';
		
		var data = fs.readFileSync(filename);

		md5hash = require('crypto').createHash('md5').update(data).digest("hex");

		zip = new JSZip(data.toString('base64'), {base64: true, checkCRC32: true});

		var containerData = extract('META-INF/container.xml');

		parseEpub(containerData, function (err,epubData) {
		
			if(err) return cb(err);
			cb(null,epubData);
		
		});

	}

	function extract(filename) {
		console.log('extracting '+filename+'...');
		if(typeof zip.files[filename] !== 'undefined') {
			return zip.files[filename].data;
		} else {
			return '';
		}
	}


	function processNavPoint(np) {

		var text = 'Untitled';
		var src = "#";

		if(typeof np.navLabel !== 'undefined') {
			text = np.navLabel[0].text[0];
		}
		if(typeof np.content !== 'undefined') {
			src = np.content[0]["$"].src;
		}
			
		htmlNav += '<li><a href="'+src+'">'+text+'</a>';

		if(typeof np.navPoint !== 'undefined') {
			htmlNav += '<ul>';
			for(var i = 0; i < np.navPoint.length; i++) {
				processNavPoint(np.navPoint[i]);
			}
			htmlNav += '</ul>'+"\n";

		}
		htmlNav += '</li>'+"\n";
	}


	function parseEpub(containerDataXML, cb) {
	  
	  /*
	  
	    Parsing chain walking down the metadata of an epub,
	    and storing it in the JSON config object
	    
	  */


		  var container, opf, ncx,
		  		opfPath, ncxPath, opsRoot,
		  		uniqueIdentifier, uniqueIdentifierValue, uniqueIdentifierScheme, 
		  		opfDataXML, ncxDataXML,
					opfPrefix = '', dcPrefix = '', ncxPrefix = '',
					metadata, manifest, spine, guide,
		  		root, ns, ncxId;

		  var parser = new xml2js.Parser();

		  parser.parseString(containerDataXML, function (err, containerJSON) {
		      if(err) return cb(err);

		      container = containerJSON.container;

		      // determine location of OPF
		      opfPath = root = container.rootfiles[0].rootfile[0]["$"]["full-path"];
		      console.log('opfPath is:'+opfPath); 

		      // set the opsRoot for resolving paths
		      if(root.match(/\//)) { // not at top level
 		      	opsRoot = root.replace(/\/([^\/]+)\.opf/i, '');
 		      	if(!opsRoot.match(/\/$/)) { // does not end in slash, but we want it to
 		      		opsRoot += '/';
 		      	}
		      } else { // at top level
		      	opsRoot = '';
		      }

		      console.log('opsRoot is:'+opsRoot+' (derived from '+root+')');

		      // get the OPF data and parse it
		      opfDataXML = extract(root);
		      parser.parseString(opfDataXML.toString(), function (err, opfJSON) {
		          if(err) return cb(err);
		          // store opf data
		          opf = (opfJSON["opf:package"]) ? opfJSON["opf:package"] : opfJSON["package"];
		          uniqueIdentifier = opf["$"]["unique-identifier"];

				  for(att in opf["$"]) {
				  	if(att.match(/^xmlns\:/)) {
				  		ns = att.replace(/^xmlns\:/,'');
				  		if(opf["$"][att]=='http://www.idpf.org/2007/opf') opfPrefix = ns+':';
				  		if(opf["$"][att]=='http://purl.org/dc/elements/1.1/') dcPrefix = ns+':';
				  	}
				  }
				  try {
					  metadata = opf[opfPrefix+"metadata"][0];
					  manifest = opf[opfPrefix+"manifest"][0];
					  spine = opf[opfPrefix+"spine"][0];
					  guide = opf[opfPrefix+"guide"][0];
				  } catch(e) {
				  	  ;
				  } 

				  for(meta in metadata) {
				  	
				  	if(meta==dcPrefix+"identifier") {

				  		if(metadata[dcPrefix+"identifier"][0]["$"]["id"]==uniqueIdentifier) {
				  			uniqueIdentifierValue = metadata[dcPrefix+"identifier"][0]["_"];
				  			//console.log('Unique ID Value = '+epubdata.uniqueIdentifierValue);
				  			uniqueIdentifierScheme = metadata[dcPrefix+"identifier"][0]["$"][opfPrefix+"scheme"];
				  		}

				  	}

				  }

			      ncxId = opf[opfPrefix+"spine"][0]["$"].toc;

		          for(item in manifest[opfPrefix+"item"]) {
		            if(manifest[opfPrefix+"item"][item]["$"].id==ncxId) {
		              ncxPath = opsRoot + manifest[opfPrefix+"item"][item]["$"].href;
		            }
		          }

		          console.log('determined ncxPath:'+ncxPath);

		          ncxDataXML = extract(ncxPath);

			      parser.parseString(ncxDataXML.toString(), function (err, ncxJSON) {

			        if(err) return cb(err);

					ncx = ncxJSON[ncxPrefix+"ncx"]; 

					var navPoints = ncx[ncxPrefix+"navMap"][0].navPoint;

					for(var i = 0; i < navPoints.length; i++) {
						processNavPoint(navPoints[i]);
					}

					htmlNav += '</ul>'+"\n";

  					epubdata = {
  						easy: {
  							primaryID: {
	  							name:uniqueIdentifier,
	  							value:uniqueIdentifierValue,
	  							scheme:uniqueIdentifierScheme 
	  						},
	  						md5: md5hash,
	  						navMapHTML: htmlNav
  						},
  						paths: {
  							opfPath: opfPath,
  							ncxPath: ncxPath,
  							opsRoot: opsRoot
  						},
  						raw: {
  							json: {
	  							prefixes: {
		  							opfPrefix:opfPrefix,
		  							dcPrefix:dcPrefix,
		  							ncxPrefix:ncxPrefix
	  							},
	  							container: container,
	  							opf: opf,
	  							ncx: ncx
	  						},
	  						xml: {
	  							opfXML: opfDataXML,
	  							ncxXML: ncxDataXML
	  						}
  						}
  					};

		        cb(null,epubdata);

		      });
		   });
		});



	}

  return {
  	open:open,
  	getZip:function () { return zip; }
  };

})();
module.exports = EpubParser;