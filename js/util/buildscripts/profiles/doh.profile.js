dependencies = {
	layers: [
		{
			name: "dohBuild.js",
			dependencies: [
				"doh.runner",
			]
		}
	],

	prefixes: [
		[ "doh", "../util/doh" ],
	]
};
