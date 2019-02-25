# passgo version 2
[passgo](https://github.com/ejcx/passgo) is a command line interface password manager that I wrote. I originally wrote it in 2016 because I wanted something sizeable I could work on during flights. Now, three years later, it's getting a much needed upgrade.

<img src="https://i.imgur.com/hFXVr4t.gif"/>

The goal of passgo is to be a password based alternative to [pass](https://www.passwordstore.org), and to use more modern cryptography. A lot of password managers were made at a time when unauthenticated AES-CBC was considered _good enough_. Changing those primitives now becomes an engineering and usability challenge for those password managers.


## Better CLI Experience
The experience of using a CLI is really important. People notice when they are using a terrible CLI, like `openssl`.

I originally implemented all of the CLI myself as one big hacky switch statement. It worked, but it wasn't as helpful as I wanted it to be.

I replaced the hacky CLI to use cobra. The CLI is a lot more descriptive and helpful to users now.
<img src="https://i.imgur.com/5jJ0WTG.png"/>

Each subcommand enforces the correct arguments and are accompanied by relevant examples on the `--help` menu.

## Simpler File Storage
In the older version of `passgo`, storing a file required using the `insert-file` subcommand and `remove-file` subcommand. Now, the process is much simpler and works with the regular insert command.

## No more git wrapping
The first version of passgo wrapped around `git` by running external commands on the system.

This was unbelievably hacky and even though it worked fine, it didn't allow for handling complex git workflows. Instead, users are now expected to manage their password vault manually with git.

# What's next for passgo?
There are still quite a few things that I would like to add to passgo.

## Chrome Extension
There's no reason that a minimal chrome extension won't make passgo one of the most usable and more security options for the privacy focused. We can make a much more secure password manager experience that lives in the browser than what is currently offered.

## More Testing
I want this code base to be more tested and have higher code coverage percentage. Right now it's very low.

## Better documentation
I'd like to make it more clear about how the crypto in passgo works. It isn't complicated, and it's currently documented in the README, but I would like visuals so anyone can easily understand it in just a couple of minutes.

Feb 24, 2019
