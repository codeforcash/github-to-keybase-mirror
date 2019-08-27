const crypto = require('crypto');

function signRequestBody(key, body) {
  return `sha1=${crypto.createHmac('sha1', key).update(body, 'utf-8').digest('hex')}`;
}

module.exports.githubWebhookListener = (event, context, callback) => {
  var errMsg; // eslint-disable-line
  const token = process.env.GITHUB_WEBHOOK_SECRET;
  var accountId = context.invokedFunctionArn.split(":")[4];
  var queueUrl = 'https://sqs.us-east-1.amazonaws.com/' + accountId + '/gitClonerQueue';
  const headers = event.headers;
  const sig = headers['X-Hub-Signature'];
  const githubEvent = headers['X-GitHub-Event'];
  const id = headers['X-GitHub-Delivery'];
  const calculatedSig = signRequestBody(token, event.body);
  const eventObj = JSON.parse(event.body);

  if (typeof token !== 'string') {
    errMsg = 'Must provide a \'GITHUB_WEBHOOK_SECRET\' env variable';
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  if (!sig) {
    errMsg = 'No X-Hub-Signature found on request';
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  if (!githubEvent) {
    errMsg = 'No X-Github-Event found on request';
    return callback(null, {
      statusCode: 422,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  if (!id) {
    errMsg = 'No X-Github-Delivery found on request';
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  if (sig !== calculatedSig) {
    errMsg = 'X-Hub-Signature incorrect. Github webhook token doesn\'t match';
    return callback(null, {
      statusCode: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: errMsg,
    });
  }

  /* eslint-disable */
  console.log('---------------------------------');
  console.log(`Github-Event: "${githubEvent}" with action: "${eventObj.action}"`);
  console.log('---------------------------------');
  console.log('Event = ' + JSON.stringify(event));
  console.log('---------------------------------');
  console.log('Body = ' + JSON.stringify(eventObj));
  /* eslint-enable */

  var paperkey = event.queryStringParameters['paperkey'];
  const keybaseRepoName = event.queryStringParameters['keybaseRepoName'];
  const username = event.queryStringParameters['username'];
  const githubRepoURL = eventObj.repository.html_url;
  const githubRepoName = eventObj.repository.name;
  const githubUsername = eventObj.repository.owner.login;
  var githubRepoIsPrivate = eventObj.repository.private;

  if(githubRepoIsPrivate){
    githubRepoIsPrivate = 'true';
  }
  else {
    githubRepoIsPrivate = 'false';
  }

  // Require objects for sending message to SQS queue.
  var aws = require('aws-sdk');

  // Instantiate SQS.
  var sqs = new aws.SQS({
    region: 'us-east-1'
  });

  var params = {
    MessageBody: "Hello Git Cloner",
    QueueUrl: queueUrl,
    DelaySeconds: 0,
    MessageAttributes: {
      paperkey: { DataType: 'String', StringValue: paperkey},
      keybaseRepoName: { DataType: 'String', StringValue: keybaseRepoName},
      username: { DataType: 'String', StringValue: username},
      githubRepoURL: { DataType: 'String', StringValue: githubRepoURL},
      githubRepoName: { DataType: 'String', StringValue: githubRepoName},
      githubUsername: { DataType: 'String', StringValue: githubUsername},
      githubRepoIsPrivate: { DataType: 'String', StringValue: githubRepoIsPrivate}
    }
  };

  sqs.sendMessage(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else     console.log(data);
  });

  // For more on events see https://developer.github.com/v3/activity/events/types/

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      input: event,
    }),
  };

  return callback(null, response);

};
