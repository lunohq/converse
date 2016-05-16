# converse

High availability bot framework.

Run multiple Converse Controller processes.

Each Controller will listen for team ids added to the connection queue. The Controller will only open 1 connection per team, if it retrieves a team id it has already connected, it will return the id to the queue to allow another Controller to open up a connection.

For each team the Controller manages, it will create a new Bot instance that will connect to the RTM API.

As the Bot receives messages from the API it will pass it through Receive Middleware that has been configured on the Controller.

Each middleware function should have the following signature:

```
/**
* Middleware function signature
*
* @param {Object} context is a Context instance.
* @param {Object} message is a raw message from Slack's API.
* @param {Function} next is a function that will return a promise and execute the next middleware in the stack.
async function (context, message, next) => {}
```

```
async function time(ctx, message, next) => {
    const start = new Date()
    await next()
    const end = new Date()
    console.log('took %s seconds', end - start)
}

function router(ctx, message, next) => {
    try {
        await execute(flows, ctx, message)
    } catch (err) {
        bla
    }
}

class Greet extends Flow {

    function match(ctx, message) {
        if (message.text === 'hi') {
            return true
        }
        return false
    }

    function execute(ctx, message) {
        const { bot, thread } = ctx
        await thread.log('greeting')
        await bot.reply(message, 'hi!')
        await thread.close()
    }

}

class Infer extends Flow {
    function match(ctx, message) {
        return true
    }

    function execute(ctx, message) {
        const greet = new Greet()
        await greet.execute(ctx, message)
    }
}

```
