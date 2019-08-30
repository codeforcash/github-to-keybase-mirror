const exec = require('child_process').execSync;
var paperkey = '';
var keybaseRepoURI = '';
var username = '';
var githubRepoURL = '';
var githubRepoName = '';
var githubUsername = '';
var githubRepoIsPrivate = '';
var cmd = '';
var useSSH = false;

async function execute(cmd, cwd){
  try{
    if(cwd == ''){
      return await exec(cmd).toString();
    }
    else{
      return await exec(cmd, { cwd: cwd }).toString();
    }
  } catch (error){
    console.log(error.message);
  }
}

function setEnvironment(){

  const fs = require("fs");

  //Check if the container was already started and made these directories yet. Otherwise, create them
  if (!fs.existsSync('/tmp/gopath/')) {

    cmd = 'mkdir /tmp/gopath/ && mkdir /tmp/gopath/bin/';

    execute(cmd, '');

    process.env['PATH'] = process.env['PATH'] + ':' + '/tmp/gopath/bin';

    cmd = 'cp /var/task/gopath/bin/* /tmp/gopath/bin/';

    execute(cmd, '');

    cmd = 'chmod 777 /tmp/gopath/bin/*'

    execute(cmd, '');

  }

  //Check if the Github Repository we are trying to clone is Private
  if(githubRepoIsPrivate) {
    useSSH = true;
  } else {
    useSSH = false;
  }

  //If so, and if they have an SSH file to use place their SSH file into the appropriate directory
  //and change it's readability so that it is not too readable for the git clone comand
  if (useSSH && !fs.existsSync('/tmp/.ssh/')) {

    cmd = 'mkdir /tmp/.ssh/';

    execute(cmd, '');

    cmd = 'cp /var/task/.ssh/* /tmp/.ssh/';

    execute(cmd, '');

    cmd = 'chmod 400 /tmp/.ssh/*'

    execute(cmd, '');

  }

  //If we are still running the same container delete the old temp git repo that was mirrored
  if (fs.existsSync('/tmp/_tmp.git')) {

    cmd = 'rm -rf _tmp.git';

    execute(cmd, '/tmp');

  }

}

function startKeybase(){

  cmd = 'keybase ctl start';

  execute(cmd, '');

  //If the container is still running, log out of the old credentials
  cmd = 'keybase logout';

  console.log('Logging out...');

  execute(cmd, '');

  //Log into Keybase in oneshot with a paperkey as the device
  cmd = `keybase oneshot --username ${username} --paperkey "${paperkey}"`;

  console.log('Logging in with new credentials...');

  execute(cmd, '');

}

function cloneRepo(){

  //Check if we are cloning from a private or public github repo and adjust accordingly
  if(useSSH){

    cmd = `git clone --mirror git@github.com:${githubUsername}/${githubRepoName}.git _tmp.git`;

  }else{

    cmd = `git clone --mirror ${githubRepoURL} _tmp.git`;

  }

  execute(cmd, '/tmp');

  //Add keybase repo as remote to be able to push and update easier
  cmd = 'git remote add keybase ' + keybaseRepoURI;

  execute(cmd, '/tmp/_tmp.git');

  //Push the mirrored repo from github to keybase
  cmd = 'git push -f keybase master';

  execute(cmd, '/tmp/_tmp.git');


  //Clean up
  cmd = 'rm -rf _tmp.git';

  execute(cmd, '/tmp');

}

function main(){

  setEnvironment();

  startKeybase();

  cloneRepo();

}

module.exports.githubtoKeybaseCloner = async function(event) {

      const attr = event.Records[0].messageAttributes;

      paperkey = attr.paperkey.stringValue;
      keybaseRepoURI = attr.keybaseRepoURI.stringValue;
      username = attr.username.stringValue;
      githubRepoURL = attr.githubRepoURL.stringValue;
      githubRepoName = attr.githubRepoName.stringValue;
      githubUsername = attr.githubUsername.stringValue;
      githubRepoIsPrivate = attr.githubRepoIsPrivate.stringValue;


      //Message attributes do not have a boolean type, so convert the string of the message to boolean
      if(githubRepoIsPrivate === 'true'){
        githubRepoIsPrivate = true;
      } else {
        githubRepoIsPrivate = false;
      }

    //lambda-git allows us to use git command line functions in lambda environments
    //After the promise passes, the module is ready and we can run our commands
    await require("lambda-git")()
      .then(function () {

        main();

      }).catch(function (error) {
        console.log(error);
      });

  return {};
}
