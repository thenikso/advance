# advance lang

An **experimental** language interpreter in Javascript, inspired by [Rye lang](https://ryelang.org/).

```
greet: fn { name } { "Hello, " + name + "!" |print }
greet "Advance"
```

## Installation

To install globally, run:

```
npm install -g @nikso/advance
```

## Using the REPL

You can now start an interactive session with `adv`:

```bash
$ adv
⟩ a: 1 + 1
2
⟩ a + 40
42
```

## Using it in the browser

You can also use Advance in the browser. To do so, you can use the
`advance.js` file in the `dist` folder.

```html
<html>
  <body>
    <script type="module">
      import { exec, createContext, adv } from './dist/advance.js';

      const result = await adv`a: 1 + 1 a + 40`;
      // or
      const result2 = exec('a: 1 + 1 a + 40', createContext());

      console.log(result, result2); // 42 42
    </script>
  </body>
</html>
```

## Development

Clone this repository and run:
1. `npm install` to install the dependencies
2. `npm run dev` to serve the root folder
3. open `http://localhost:3000` in your browser
4. open the devtools console to see the output of tests and use `adv`

You can also run `npm link -g` to get a `adv` command wich will use the local
version of the project.
