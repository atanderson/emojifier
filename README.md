#Emojifier
*turn text into an emoji using a bayesian classifier*

###Project dependencies
- redis 3.0+
- node 4.0+
- gulp

###Setting up the application
- `npm install` to install dependent packages
- edit `secrets.js` with your personal twitter api keys
- build the frontend with `gulp`
- start the redis server
- `npm start` to connect to twitter stream, create classifier, and host server

when running, the application frontend can be accessed via http://localhost:8080/

