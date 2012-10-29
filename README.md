epub-parser
===========

# What It Does

Epub-parser is a simple way to make working with epub files more programmer- and web- friendly by converting its data structures to JSON and providing some simplified structures for convenient access to that data.

It takes a lot of essential data from any valid Epub file and makes it available in an "easy" JSON namespace. It also converts the rest of an Epub's metadata to JSON structures, and makes that available via a "raw" namespace. It takes care of a lot of dirty work in determining the primary ID of a file, the location of the NCX file, and even builds some boilerplate HTML you can use in your web app to display a user-friendly version of NCX data.

# Requirements

This depends on the xml2js and adm-zip modules.

# Installing

As of right now, there is now package installer. Drop the contents of the project into a directory called epub-parser, in your own module/project's node_modules directory. Then type "npm install" to install dependencies.

# Usage

See the example directory for a sample of how to use this module.

