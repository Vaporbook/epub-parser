epub-parser
===========

# What It Does

Epub-parser is a simple way to make working with epub files more programmer- and web- friendly by converting its data structures to JSON and providing some simplified structures for convenient access to that data.

Specifically, it:

* takes a lot of essential data from any valid Epub file and makes it available in an "easy" JSON namespace
* converts the rest of an Epub's metadata to JSON structures, and makes that available via a "raw" namespace
* takes care of a lot of dirty work in determining the primary ID of a file, the location of the NCX file, the OPS root, etc
* builds some boilerplate HTML you can use in your web app to display a user-friendly version of NCX data (note: this functionality is expanded in the epub2html module if you need more like it)

# Requirements

This depends on the xml2js and node-zip modules.
Eyes is also required but you can use console instead if you want.

# Installing

    npm install epub-parser

# Usage

See the example directory for a sample of how to use this module. See also the [epub2web](https://github.com/Vaporbook/epub2web), [epub-cache](https://github.com/Vaporbook/epub-cache), and [epub-editor](https://github.com/Vaporbook/epub-editor) for modules that leverage this one, and furtehr examples of how this can be used.

In a nutshell though, it's as simple as this:

```javascript

var epubParser = require('epub-parser');

epubParser.open(epubFullPath, function (err, epubData) {

	if(err) return console.log(err);
	console.log(epubData.easy);
	console.log(epubData.raw.json.ncx);

});

```

# Data structure

Use the example with a valid epub file to see how epub-parser builds its data structure. The eyes module will help you inspect it at all levels in a clean way (it's currently a dependency).

Here's an example of the "easy" namespace using a sample file from Jellybooks:

```javascript

{
    navMapHTML: '<ul><li><a href="safe_house_cover.html">Cover</a></li>\n<li><a href="safe_house_booktitlepage.html">Title Page</a></li>\n<li><a href="safe_house_dedication.html">Dedication</a></li>\n<li><a href="safe_house_toc.html">Table of Contents</a></li>\n<li><a href="safe_house_aboutthisbook.html">A Note on the Isle of Man</a></li>\n<li><a href="safe_house_chapter_01.html">I don’t remember much . . .</a></li>\n<li><a href="safe_house_part_01.html">Part One</a><ul><li><a href="safe_house_chapter_02.html">Chapter One</a></li>\n<li><a href="safe_house_chapter_03.html">Chapter Two</a></li>\n<li><a href="safe_house_chapter_04.html">Chapter Three</a></li>\n<li><a href="safe_house_chapter_05.html">Chapter Four</a></li>\n<li><a href="safe_house_chapter_06.html">Chapter Five</a></li>\n</ul>\n</li>\n<li><a href="jellybooks.html">Jellybooks sweet page</a></li>\n</ul>\n',
    primaryID: {
        name: 'BookId',
        scheme: 'ISBN',
        value: 'safe_house'
    }
}


```

Here's another example showing how the NCX data structure is mapped:


```javascript

{
    docTitle: [
        {
            text: [ 'Safe House' ]
        }
    ],
    docAuthor: [
        {
            text: [ 'Ewan, Chris' ]
        }
    ],
    $: { xmlns: 'http://www.daisy.org/z3986/2005/ncx/', version: '2005-1' },
    navMap: [
        {
            navPoint: [
                {
                    content: [
                        {
                            $: { src: 'safe_house_cover.html' }
                        }
                    ],
                    navLabel: [
                        {
                            text: [ 'Cover' ]
                        }
                    ],
                    $: {
                        class: 'chapter',
                        playOrder: '1',
                        id: 'navPoint-1'
                    }
                },
                {
                    content: [
                        {
                            $: { src: 'safe_house_booktitlepage.html' }
                        }
                    ],
                    navLabel: [
                        {
                            text: [ 'Title Page' ]
                        }
                    ],
                    $: {
                        class: 'chapter',
                        playOrder: '2',
                        id: 'navPoint-2'
                    }
                },
                {
                    content: [
                        {
                            $: { src: 'safe_house_dedication.html' }
                        }
                    ],
                    navLabel: [
                        {
                            text: [ 'Dedication' ]
                        }
                    ],
                    $: {
                        class: 'chapter',
                        playOrder: '3',
                        id: 'navPoint-3'
                    }
                },
                {
                    content: [
                        {
                            $: { src: 'safe_house_toc.html' }
                        }
                    ],
                    navLabel: [
                        {
                            text: [ 'Table of Contents' ]
                        }
                    ],
                    $: {
                        class: 'chapter',
                        playOrder: '4',
                        id: 'navPoint-4'
                    }
                },
                {
                    content: [
                        {
                            $: { src: 'safe_house_aboutthisbook.html' }
                        }
                    ],
                    navLabel: [
                        {
                            text: [ 'A Note on the Isle of Man' ]
                        }
                    ],
                    $: {
                        class: 'chapter',
                        playOrder: '5',
                        id: 'navPoint-5'
                    }
                },
                {
                    content: [
                        {
                            $: { src: 'safe_house_chapter_01.html' }
                        }
                    ],
                    navLabel: [
                        {
                            text: [ 'I don’t remember much . . .' ]
                        }
                    ],
                    $: {
                        class: 'chapter',
                        playOrder: '6',
                        id: 'navPoint-6'
                    }
                },
                {
                    content: [
                        {
                            $: { src: 'safe_house_part_01.html' }
                        }
                    ],
                    navLabel: [
                        {
                            text: [ 'Part One' ]
                        }
                    ],
                    $: {
                        class: 'chapter',
                        playOrder: '7',
                        id: 'navPoint-7'
                    },
                    navPoint: [
                        {
                            content: [
                                {
                                    $: { src: 'safe_house_chapter_02.html' }
                                }
                            ],
                            navLabel: [
                                {
                                    text: [ 'Chapter One' ]
                                }
                            ],
                            $: {
                                class: 'chapter',
                                playOrder: '8',
                                id: 'navPoint-8'
                            }
                        },
                        {
                            content: [
                                {
                                    $: { src: 'safe_house_chapter_03.html' }
                                }
                            ],
                            navLabel: [
                                {
                                    text: [ 'Chapter Two' ]
                                }
                            ],
                            $: {
                                class: 'chapter',
                                playOrder: '9',
                                id: 'navPoint-9'
                            }
                        },
                        {
                            content: [
                                {
                                    $: { src: 'safe_house_chapter_04.html' }
                                }
                            ],
                            navLabel: [
                                {
                                    text: [ 'Chapter Three' ]
                                }
                            ],
                            $: {
                                class: 'chapter',
                                playOrder: '10',
                                id: 'navPoint-10'
                            }
                        },
                        {
                            content: [
                                {
                                    $: { src: 'safe_house_chapter_05.html' }
                                }
                            ],
                            navLabel: [
                                {
                                    text: [ 'Chapter Four' ]
                                }
                            ],
                            $: {
                                class: 'chapter',
                                playOrder: '11',
                                id: 'navPoint-11'
                            }
                        },
                        {
                            content: [
                                {
                                    $: { src: 'safe_house_chapter_06.html' }
                                }
                            ],
                            navLabel: [
                                {
                                    text: [ 'Chapter Five' ]
                                }
                            ],
                            $: {
                                class: 'chapter',
                                playOrder: '12',
                                id: 'navPoint-12'
                            }
                        }
                    ]
                },
                {
                    content: [
                        {
                            $: { src: 'jellybooks.html' }
                        }
                    ],
                    navLabel: [
                        {
                            text: [ 'Jellybooks sweet page' ]
                        }
                    ],
                    $: {
                        class: 'chapter',
                        playOrder: '13',
                        id: 'navPoint-13'
                    }
                }
            ]
        }
    ],
    head: [
        {
            meta: [
                {
                    $: { name: 'dtb:ISBN', content: 'safe_house' }
                },
                {
                    $: { name: 'dtb:generator', content: 'EPUBLib version 3.0' }
                },
                {
                    $: { name: 'dtb:depth', content: '2' }
                },
                {
                    $: { name: 'dtb:totalPageCount', content: '0' }
                },
                {
                    $: { name: 'dtb:maxPageNumber', content: '0' }
                }
            ]
        }
    ]
}


```


# Troubleshooting

Epub-parser is non-validating. Therefore, it will be fairly tolerant as long as the XML is well-formed and the metadata files can be found where they're expected to be found. However, you should use the IDPF's epubcheck validator to make sure you're only using valid epubs as input.

# Bug reporting

Please report bugs to vaporbook on github. Your help is appreciated. Also, subscribe to this repo, as it will be used in several projects I'm working on, and I hope to make frequent fixes and updates.

