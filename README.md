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

To build, run `npm run build`. The ERA engine uses Rollup, and builds to `build/era.js` as well as `build/era.module.js`.

To bring up a demo, run `npm start` and navigate to `localhost:5000/dev.html`. It will
be a blank screen, but you can interact with the engine in the console.
