/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as core from '@actions/core'
import * as github from '@actions/github'
import { Context } from '@actions/github/lib/context'
import * as webpush from 'web-push'
// @ts-ignore
import * as lzbase62 from 'lzbase62'

async function notifyStarted({
  subscription,
  context,
  token,
  name,
  env
}: {
  token: string
  subscription: webpush.PushSubscription
  context: Context
  email: string
  name: string
  message: string
  env: string
}): Promise<void> {
  try {
    const octokit = github.getOctokit(token)

    const wr = await octokit.actions.getWorkflowRun({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: context.runId
    })

    const webpushBody = {
      '@type': 'Notification',
      '@context': 'http://schema.org/extensions',
      title: `${context.payload.repository?.full_name} workflow STARTED`,
      body: `Workflow ${context.workflow} #${context.runNumber} STARTED by ${name} on ${context.payload.repository?.full_name} ${env}`,
      url: wr.data.html_url
    }
    const sendResult = await webpush.sendNotification(
      subscription,
      JSON.stringify(webpushBody)
    )
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function notifyFinished({
  token,
  subscription,
  context,
  status,
  publishUrl,
  email,
  name,
  message,
  env
}: {
  token: string
  subscription: webpush.PushSubscription
  context: Context
  status: string
  publishUrl: string
  email: string
  name: string
  message: string
  env: string
}): Promise<void> {
  try {
    const conclusion = status.toUpperCase()

    const octokit = github.getOctokit(token)

    const wr = await octokit.actions.getWorkflowRun({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: context.runId
    })

    const webpushBody = {
      '@type': 'Notification',
      '@context': 'http://schema.org/extensions',
      title: `${context.payload.repository?.full_name} workflow ${conclusion}`,
      body: `Workflow ${context.workflow} #${context.runNumber} ${conclusion} on ${context.payload.repository?.full_name} ${env}
${message} (${name}: ${email})`,
      url: status === 'success' ? publishUrl : wr.data.html_url
    }

    const sendResult = await webpush.sendNotification(
      subscription,
      JSON.stringify(webpushBody)
    )
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token')
    const subscription: webpush.PushSubscription = JSON.parse(
      lzbase62.decompress(core.getInput('subscription'))
    )
    const privateKey = core.getInput('private-key')
    const publicKey = core.getInput('public-key')
    const subject = core.getInput('subject')

    const templateType = core.getInput('type')
    if (!templateType || ['start', 'finish'].indexOf(templateType) === -1) {
      core.setFailed("'type' input must be 'start' or 'finish'")
      return
    }
    const status = core.getInput('status').toLowerCase()
    const email = core.getInput('email')
    const name = core.getInput('name')
    const message = core.getInput('message')
    const env = core.getInput('env')
    const publishUrl = core.getInput('publish-url')

    const { context } = github

    webpush.setVapidDetails(subject, publicKey, privateKey)

    switch (templateType) {
      case 'start':
        await notifyStarted({
          token,
          subscription,
          context,
          email,
          name,
          message,
          env
        })
        break
      case 'finish':
      default:
        await notifyFinished({
          token,
          subscription,
          context,
          publishUrl,
          status,
          email,
          name,
          message,
          env
        })
        break
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
