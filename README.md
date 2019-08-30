# GitHub to Keybase Cloner

This app enables you to set a webhook in a GitHub repo which will mirror to Keybase any pushes to `master`.

## Benefits:

- No need to sweat if GitHub goes down, you can continue to work off your keybase repo
- Free backup of your code

## How it works:

 GitHub webhooks have a 10 second timeout, so the webhook calls an AWS Lambda function that populates an Amazon SQS queue.  Then, a second AWS Lambda function is automatically invoked and performs the cloning and pushing to Keybase.

## Prerequisites:

**Serverless**

* Use 'npm install serverless -g' in the command line if your don't already have it installed

**AWS**

* You should have an AWS account and have downloaded [the AWS CLI tool](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

**No worries**

All of this should fall within the AWS free tier!

# Setup

Setup is as simple as running an install script and then enabling a webhook.

1. `node setup.js --paperkey="this is my paper key" --username=yourUsername --keybaseRepoURI=keybase://type/yourUsername/keybaseRepoName`

  After the deploy has finished you should see something like:
  ```bash
    Random Github Webhook Secret:  69jzxwsylp9iu2nmhzykpp
    Github Webhook URL:  https://si2ymypm5a.execute-api.us-east-1.amazonaws.com/dev/webhook/?paperkey=this%20is%20my%20paper%20key&username=yourUsername&keybaseRepoURI=keybase://type/yourUsername/keybaseRepoName
  ```

2. Configure your [webhook in your GitHub repo settings](https://developer.github.com/webhooks/creating/#setting-up-a-webhook)

  **NOTE: Make sure your "Content Type" is set to "application/json"**

3. Optional: Set up SSH key for private Github Repositories

  In the folder named ".ssh" in your project directory place the ssh key you use for github. Make sure it's named "id_rsa."

# Misc

## Known limitations

If your Git repo uses [cutting edge Git LFS technology](https://jfrog.com/blog/git-lfs/), unfortunately, Keybase does not support the Large File Storage standard.  What will happen is it will push only the LFS metadata without replicating any of the file contents.

## License

BSD-3-Clause
