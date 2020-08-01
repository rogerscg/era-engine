# ERA Engine

A simple wrapper around Three.js and peripherals such as physics engines, TWEEN,
etc. to aid the creation of games or other visuals. Used by [Slapshot](https://store.steampowered.com/app/707680/Slapshot/) and [Earth Revival Act (ERA)](https://earthrevivalact.herokuapp.com/).

[**Documentation**](https://github.com/rogerscg/era-engine/wiki)

[**Examples**](https://rogerscg.github.io/era-engine/)

## Contributing

The ERA engine is missing many features, as it was built for two specific games.
In order to be useful for the general case, others will need to request or
implement features on their own.

[**GitHub Project with future features/issues**](https://github.com/users/rogerscg/projects/2?fullscreen=true)

## Developing

To build, run `npm run build`. The ERA engine uses Rollup and Babel, building to
`build/era.js`. Examples must be rebuilt with `npm run-script build-examples`.
To run both before submitting a PR, run `npm run-script build-all`. To build a
specific example, run `npm run-script build-examples -- --example=<example>`.

To bring up a demo, install `http-server` by running `npm install -g http-server`.
You can then run `npm start` or `http-server` and navigate to `localhost:5000`.
