const exec = require('child_process').execSync;
const fs = require('fs');
var randomGithubWebhookSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
var webhookURL;
var paperkey = '';
var keybaseRepoURI = '';
var username = '';

function setupDirectory(){
  var dir = './node_modules';

  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  exec('npm install');
}

function getParameters(){

  const args = require('minimist')(process.argv.slice(2));

  paperkey = args['paperkey'];
  username = args['username'];
  keybaseRepoURI = args['keybaseRepoURI'];

}

function replaceParameter(){
  var data = fs.readFileSync('serverless.yml', 'utf8');

  if(data.indexOf('REPLACE-WITH-YOUR-SECRET-HERE') >= 0){
    var result = data.replace(/REPLACE-WITH-YOUR-SECRET-HERE/g, randomGithubWebhookSecret);

    fs.writeFileSync('serverless.yml', result, 'utf8');
  }
  else{
    var newData = data.split('GITHUB_WEBHOOK_SECRET: ');
    newData = newData[1].split('\r');
    randomGithubWebhookSecret = newData[0];
  }
}

function getEndpointURL(result){

  result = result.split("endpoints:");

  result = result[1].split('functions');

  result = result[0].split('POST - ');

  result = result[1].split('\n');

  webhookURL = result[0];

}

function generateWebhookURL(){

  paperkey = encodeURI(paperkey);

  webhookURL += `/?paperkey=${paperkey}&username=${username}&keybaseRepoURI=${keybaseRepoURI}`;

}

function main(){

  console.log("Setting up directory...");
  setupDirectory();

  getParameters();

  replaceParameter();

  console.log("Deploying functions, this will take a while...");
  var result = exec('serverless deploy').toString();

  console.log("Generating Webhook URL");
  getEndpointURL(result);

  generateWebhookURL();

  console.log("Random Github Webhook Secret: ", randomGithubWebhookSecret);

  console.log("Github Webhook URL: ", webhookURL);

}

main();
