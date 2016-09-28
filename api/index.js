var app = require('./app');

app.listen(3000, function(){
  console.log("Express server listening on port 3000 in %s mode", app.settings.env);
});