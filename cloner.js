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

function execute(cmd, cwd){

  if(cwd == ''){
    return exec(cmd);
  }
  else{
    return exec(cmd, { cwd: cwd });
  }
}

function setEnvironment(){

  const fs = require("fs");

  if (!fs.existsSync('/tmp/gopath/')) {

    cmd = 'mkdir /tmp/gopath/ && mkdir /tmp/gopath/bin/';

    execute(cmd, '');

    process.env['PATH'] = process.env['PATH'] + ':' + '/tmp/gopath/bin';

    cmd = 'cp /var/task/gopath/bin/* /tmp/gopath/bin/';

    execute(cmd, '');

    cmd = 'chmod 777 /tmp/gopath/bin/*'

    execute(cmd, '');

  }

  if(githubRepoIsPrivate) {
    useSSH = true;
  } else {
    useSSH = false;
  }

  if (useSSH && !fs.existsSync('/tmp/.ssh/')) {

    cmd = 'mkdir /tmp/.ssh/';

    execute(cmd, '');

    cmd = 'cp /var/task/.ssh/* /tmp/.ssh/';

    execute(cmd, '');

    cmd = 'chmod 400 /tmp/.ssh/*'

    execute(cmd, '');

  }

}

function startKeybase(){

  cmd = 'keybase ctl start';

  execute(cmd, '');

  cmd = `keybase oneshot --username ${username} --paperkey "${paperkey}"`;

  execute(cmd, '');
}

function cloneRepo(){

  if(useSSH){

    cmd = `git clone --mirror git@github.com:${githubUsername}/${githubRepoName}.git _tmp.git`;

  }else{

    cmd = `git clone --mirror ${githubRepoURL} _tmp.git`;

  }

  execute(cmd, '/tmp');

  cmd = 'git push --mirror ' + keybaseRepoURI;

  execute(cmd, '/tmp/_tmp.git');

  cmd = 'cd .. && rm -rf _tmp.git';

  execute(cmd, '/tmp/_tmp.git');

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

      if(githubRepoIsPrivate === 'true'){
        githubRepoIsPrivate = true;
      } else {
        githubRepoIsPrivate = false;
      }

    await require("lambda-git")()
      .then(function () {

        main();

      }).catch(function (error) {
        console.log(error);
      });

  return {};
}
