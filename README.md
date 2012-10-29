epub-parser
===========

# What It Does

Epub-parser is a simple way to make working with epub files more programmer- and web- friendly by converting its data structures to JSON and providing some simplified structures for convenient access to that data.

Specifically, it:

*takes a lot of essential data from any valid Epub file and makes it available in an "easy" JSON namespace
*converts the rest of an Epub's metadata to JSON structures, and makes that available via a "raw" namespace
*takes care of a lot of dirty work in determining the primary ID of a file, the location of the NCX file
*builds some boilerplate HTML you can use in your web app to display a user-friendly version of NCX data

# Requirements

This depends on the xml2js and adm-zip modules.
Eyes is also required but you can use console instead if you want.

# Installing

As of right now, there is no package installer. Drop the contents of the project into a directory called epub-parser, in your own module/project's node_modules directory. Then type "npm install" to install dependencies.

# Usage

See the example directory for a sample of how to use this module.

# Data structure

Use the example with a valid epub file to see how epub-parser builds its data structure. The eyes module will help you inspect it at all levels in a clean way (it's currently a dependency).

# Troubleshooting

Epub-parser is non-validating. Therefore, it will be fairly tolerant as long as the XML is well-formed and the metadata files can be found where they're expected to be found. However, you should use the IDPF's epubcheck validator to make sure you're only using valid epubs as input.

# Bug reporting

Please report bugs to vaporbook on github. Your help is appreciated. Also, subscribe to this repo, as it will be used in several projects I'm working on, and I hope to make frequent fixes and updates.

