# Github Actions for Web Push Notifications

### Usage

1. Add `WEBPUSH_VAPID_PUBLIC_KEY`, `WEBPUSH_VAPID_PRIVATE_KEY`, and `WEBPUSH_EMAIL` on your repository's configs on Settings > Secrets

2. Get incoming subscription information in your job and pass to this step in subscription paramater, lzw compressed in base62 (use `npm install lzbase62`)

3. Add a new `step` on your workflow code as first or last step of workflow job:

```yaml
name: Github Action for Web Push Notifications

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - uses: synchealthlabs/github-action-webpush@main
      if: always() # to let this step always run even if previous step failed
      with:
        github-token: ${{ github.token }}
        subject: ${{ secrets.WEBPUSH_EMAIL }}
        public-key: ${{ secrets.WEBPUSH_VAPID_PUBLIC_KEY }}
        private-key: ${{ secrets.WEBPUSH_VAPID_PRIVATE_KEY }}
        subscription: ${{ github.event.inputs.subscription }}
        type: finish
        status: ${{ job.status }}
        name: ${{ github.event.inputs.name }}
        email:  ${{ github.event.inputs.email }}
        message: ${{ github.event.inputs.message }}
        env: ${{ github.event.inputs.env }}
        publish-url: ${{ github.event.inputs['publish-url'] }}
```
