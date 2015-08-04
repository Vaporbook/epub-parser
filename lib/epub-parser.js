var EpubParser;
//var sax = require('./sax');


EpubParser = (function() {


	var jszip = require('node-zip');
	var zip, zipEntries;
	var xml2js = require('xml2js');
	var parser = new xml2js.Parser();
	var request = require('request');
	var fs = require('fs');

	function extractText(filename) {
		//console.log('extracting '+filename);
		var file = zip.file(filename);
		if(typeof file !== 'undefined' || file !== null) {
			return file.asText();
		} else {
			throw 'file '+filename+' not found in zip';
		}
	}

	function extractBinary(filename) {
		var file = zip.file(filename);
		if(typeof file !== 'undefined') {
			return file.asBinary();
		} else {
			return '';
		}
	}

  function safeAccess(supposedArray) {
    // a quick bandaid to handle undefined lists
    // coming back from the parser - poor fix TODO
    if(typeof supposedArray === 'undefined') {
      return new Array();
    } else {
      return supposedArray;
    }
  }

	function open(filename, cb) {


		/*

			"filename" is still called "filename" but now it can be
			a full file path, a full URL, or a Buffer object
			we should eventually change its name...

		*/


		var epubdata = {};
		var md5hash;
		var htmlNav = '<ul>';

		var container, opf, ncx,
		opfPath, ncxPath, opsRoot,
		uniqueIdentifier, uniqueIdentifierValue, uniqueIdentifierScheme = null, 
		opfDataXML, ncxDataXML,
		opfPrefix = '', dcPrefix = '', ncxPrefix = '',
		metadata, manifest, spine, guide, nav,
		root, ns, ncxId,
		epub3CoverId, epub3NavId, epub3NavHtml, epub2CoverUrl = null,
		isEpub3, epubVersion;
		var itemlist, itemreflist;
		var itemHashById = {};
		var itemHashByHref = {};
		var linearSpine = {};
		var spineOrder = [];
		var simpleMeta = [];



		function readAndParseData(/* Buffer */ data, cb) {

			md5hash = require('crypto').createHash('md5').update(data).digest("hex");
	
			zip = new jszip(data.toString('binary'), {binary:true, base64: false, checkCRC32: true});
			var containerData = extractText('META-INF/container.xml');
			parseEpub(containerData, function (err,epubData) {
			
				if(err) return cb(err);
				cb(null,epubData);
			
			});

		}
			


		function parseEpub(containerDataXML, finalCallback) {
		  
		  /*
		  
		    Parsing chain walking down the metadata of an epub,
		    and storing it in the JSON config object
		    
		  */

		  parser.parseString(containerDataXML, function (err, containerJSON) {

		  	parseContainer(err, containerJSON, finalCallback);

		  });

		}

		function parseContainer(err, containerJSON, finalCallback) {

			  var cb = finalCallback;

		      if(err) return cb(err);

		      container = containerJSON.container;

		      // determine location of OPF
		      opfPath = root = container.rootfiles[0].rootfile[0]["$"]["full-path"];
		    //  console.log('opfPath is:'+opfPath); 

		      // set the opsRoot for resolving paths
		      if(root.match(/\//)) { // not at top level
 		      	opsRoot = root.replace(/\/([^\/]+)\.opf/i, '');
 		      	if(!opsRoot.match(/\/$/)) { // does not end in slash, but we want it to
 		      		opsRoot += '/';
 		      	}
 		      	if(opsRoot.match(/^\//)) {
 		      		opsRoot = opsRoot.replace(/^\//, '');
 		      	}
		      } else { // at top level
		      	opsRoot = '';
		      }

		      console.log('opsRoot is:'+opsRoot+' (derived from '+root+')');

		      // get the OPF data and parse it
		      console.log('parsing OPF data');
		      opfDataXML = extractText(root);

		      parser.parseString(opfDataXML.toString(), function (err, opfJSON) {
		          if(err) return cb(err);
		          // store opf data
		          opf = (opfJSON["opf:package"]) ? opfJSON["opf:package"] : opfJSON["package"];
		          uniqueIdentifier = opf["$"]["unique-identifier"];
		          epubVersion = opf["$"]["version"][0];

		          isEpub3 = (epubVersion=='3'||epubVersion=='3.0') ? true : false;
		          
		        //  console.log('epub version:'+epubVersion);

				  for(att in opf["$"]) {
				  	if(att.match(/^xmlns\:/)) {
				  		ns = att.replace(/^xmlns\:/,'');
				  		if(opf["$"][att]=='http://www.idpf.org/2007/opf') opfPrefix = ns+':';
				  		if(opf["$"][att]=='http://purl.org/dc/elements/1.1/') dcPrefix = ns+':';
				  	}
				  }

				  parsePackageElements();

				  // spine

			      itemlist = manifest.item;

				  itemreflist = spine.itemref;

				  buildItemHashes();

				  buildLinearSpine();

				  // metadata

				  buildMetadataLists();

			      if(!ncxId) { // assume epub 3 navigation doc

			      	if(!isEpub3) cb(new Error('ncx id not found but package indicates epub 2'));

			      	ncxDataXML = '';
		        		   ncx = {};
		        	    ncxPath = '';
		        	    htmlNav = null;

		        	    if(!epub3NavHtml) return cb(new Error('epub 3 with no nav html'));

		        	    parser.parseString(epub3NavHtml, function (err, navJSON) {

		        	    	if(err) return cb(err);

		        	    	nav = navJSON;
		        	        epubdata = getEpubDataBlock();
		        			cb(null, epubdata);
		        	    });

			      } else { // epub 2, use ncx doc


			      	  for(item in manifest[opfPrefix+"item"]) {
			            if(manifest[opfPrefix+"item"][item]["$"].id==ncxId) {
			              ncxPath = opsRoot + manifest[opfPrefix+"item"][item]["$"].href;
			            }
			          }
			          //console.log('determined ncxPath:'+ncxPath);
			          ncxDataXML = extractText(ncxPath);

			          parser.parseString(ncxDataXML.toString(), function (err, ncxJSON) {

			        		if(err) return cb(err);

		        			function setPrefix(ncxJSON) {
								for(att in ncxJSON["$"]) {
									//console.log(att);
								  	if(att.match(/^xmlns\:/)) {
								  		var ns = att.replace(/^xmlns\:/,'');
								  		if(ncxJSON["$"][att]=='http://www.daisy.org/z3986/2005/ncx/') ncxPrefix = ns+':';
								  	}
								}
							}

							// grab the correct ns prefix for ncx

		        			for(prop in ncxJSON) {
		        				//console.log(prop);
		        				if(prop === '$') { // normal parse result
		        					setPrefix(ncxJSON);
		        				} else {

		        					if(typeof ncxJSON[prop]['$'] !== 'undefined') {
		        						//console.log(ncxJSON[prop]['$']);	
		 			        			setPrefix(ncxJSON[prop]);
		        					}
		        				}
		        			}

		        			
		        			ncx = ncxJSON[ncxPrefix+"ncx"];

							var navPoints = ncx[ncxPrefix+"navMap"][0][ncxPrefix+"navPoint"];

							for(var i = 0; i < safeAccess(navPoints).length; i++) {
								processNavPoint(navPoints[i]);
							}
							htmlNav += '</ul>'+"\n";
		  					epubdata = getEpubDataBlock();
					        cb(null,epubdata);

			          });
			      }
		   });
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
				for(var i = 0; i < safeAccess(np.navPoint).length; i++) {
					processNavPoint(np.navPoint[i]);
				}
				htmlNav += '</ul>'+"\n";

			}
			htmlNav += '</li>'+"\n";
		}



		function buildItemHashes() {

			for(item in itemlist) {
				
				var href = itemlist[item].$.href;
				var id = itemlist[item].$.id;
				var mediaType = itemlist[item].$['media-type'];
				var properties = itemlist[item].$['properties'];
				if(typeof properties !== 'undefined') {
					if(properties == 'cover-image') {
						epub3CoverId = id;
					} else if (properties == 'nav') {
						epub3NavId = id;
						epub3NavHtml = extractText(opsRoot+href);
					}
				}
				itemHashByHref[href] = itemlist[item];
				itemHashById[id] = itemlist[item];

			}
			var itemrefs = itemreflist;
		  
		  	try {
				ncxId = spine.$.toc;
			} catch(e) {
				;
			}

		}

		function buildLinearSpine() {
			for(itemref in itemreflist) {

				var id = itemreflist[itemref].$.idref;

				spineOrder.push(itemreflist[itemref].$);

				if(itemreflist[itemref].$.linear=='yes' || typeof itemreflist[itemref].$.linear == 'undefined') {
					itemreflist[itemref].$.item = itemHashById[id];
					linearSpine[id] = itemreflist[itemref].$;
				}

			}
		}

		function buildMetadataLists() {
			var metas = metadata;
			for(prop in metas) {
				
				if(prop == 'meta') { // process a list of meta tags


					for(var i = 0; i < safeAccess(metas[prop]).length; i++) {
						
						var m = metas[prop][i].$;

						if(typeof m.name !== 'undefined') {
							var md = {};
							md[m.name] = m.content;
							simpleMeta.push(md);
						} else if (typeof m.property !== 'undefined') {
							var md = {};
							md[m.property] = metas[prop][i]._;
							simpleMeta.push(md);
						}

						if(m.name == 'cover') {
							if (typeof itemHashById[m.content] !== 'undefined') {
								epub2CoverUrl = opsRoot + itemHashById[m.content].$.href;
							}
						}


					}
					


				} else if(prop != '$') {
				
					var content = '';
					var atts = {};
					if(metas[prop][0]) {
						if(metas[prop][0].$ || metas[prop][0]._) { // complex tag
							content = (metas[prop][0]._) ?
								metas[prop][0]._ :
								metas[prop][0];

							if(metas[prop][0].$) { // has attributes
								for(att in metas[prop][0].$) {
									atts[att]=metas[prop][0].$[att];
								}
							}

						} else { // simple one, if object, assume empty
							content = (typeof metas[prop][0] == 'object') ? '' : metas[prop][0];
						}
					}
					if(typeof prop !== 'undefined') {
						var md = {};
						md[prop] = content;
						simpleMeta.push(md);
					}

					if(prop.match(/identifier$/i)) {
						if(typeof metas[prop][0].$.id) {
							if(metas[prop][0].$.id==uniqueIdentifier) {
								if(typeof content == 'object') {
									console.log('warning - content not fully parsed');
									console.log(content);
									console.log(metas[prop][0].$.id);


								} else {
									uniqueIdentifierValue = content;
									if(typeof metas[prop][0].$.scheme !== 'undefined') {
										uniqueIdentifierScheme= metas[prop][0].$.scheme;
									}								
								}

							}
						};
					}
				
				}

			}
		}

		function parsePackageElements() {
		  
		  // operates on global vars


		  if(typeof opf[opfPrefix+"manifest"] === 'undefined') {

		  		// it's a problem
		  		// gutenberg files, for example will lead to this condition
		  		// we must assume that tags are not actually namespaced

		  		opfPrefix = '';
		  }

		  try {
			  metadata = opf[opfPrefix+"metadata"][0];
		  } catch(e) {
		  	  console.log('metadata element error: '+e.message);
		  	  console.log('are the tags really namespaced with '+opfPrefix+' or not? file indicates they should be.');
		  }
		  try {
			  manifest = opf[opfPrefix+"manifest"][0];
		  } catch (e) {
		  	  console.log('manifest element error: '+e.message);
		  	  console.log('are the tags really namespaced with '+opfPrefix+' or not? file indicates they should be.');
		  	  console.log(opfDataXML);
		  	  console.log(opf);
		  	  console.log('must throw this - unrecoverable');
		  	  throw (e);
		  }
		  try {
			  spine = opf[opfPrefix+"spine"][0];
		  } catch(e) {
			  console.log('spine element error: '+e.message);
			  console.log('must throw this');
		  	  throw (e);
		  }
		  try {
			  guide = opf[opfPrefix+"guide"][0];
		  } catch (e) {
		  	  ;
		  }
		}

		function getEpubDataBlock()
		{
			return {
		  						easy: {
		  							primaryID: {
			  							name:uniqueIdentifier,
			  							value:uniqueIdentifierValue,
			  							scheme:uniqueIdentifierScheme 
			  						},
			  						epubVersion: epubVersion,
			  						isEpub3: isEpub3,
			  						md5: md5hash,
			  						epub3NavHtml: epub3NavHtml,
			  						navMapHTML: htmlNav,
			  						linearSpine: linearSpine,
									itemHashById: itemHashById, 
									itemHashByHref: itemHashByHref, 
									linearSpine: linearSpine,
									simpleMeta: simpleMeta,
									epub3CoverId: epub3CoverId,
									epub3NavId: epub3NavId,
									epub2CoverUrl: epub2CoverUrl
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
			  							ncx: ncx,
			  							nav: nav
			  						},
			  						xml: {
			  							opfXML: opfDataXML,
			  							ncxXML: ncxDataXML
			  						}
		  						}
		  	};
		}


		if(Buffer.isBuffer(filename)) {

			console.log('epub-parser parsing from buffer, not file');

			readAndParseData(filename, cb);

		} else if(filename.match(/^https?:\/\//i)) { // is a URL

			request({ 
						    uri:filename,
						    encoding:null /* sets the response to be a buffer */
					}, function (error, response, body) {


					        if (!error && response.statusCode == 200) {

					          var b = body;
			
							  readAndParseData(b, cb);

					        } else {

					          cb(error,null);

					        }
						        
					});
			

		} else { // assume local full path to file

			fs.readFile(filename, 'binary', function (err, data) {

				if(err) return cb(err);

				readAndParseData(data, cb);

			});

		}

	} // end #open function definition block


	return {
		open:open,
		getZip:function () { return zip; },
		getJsZip: function () { return jszip; },
		extractBinary: extractBinary,
		extractText: extractText
	};

})();
module.exports = EpubParser;
